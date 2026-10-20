import { randomUUID } from "crypto";
import { readStore, updateStore } from "./db";
import { canViewTicket, dispatchBlockReason, nextTechnicianStatus } from "./policy";
import { ROOMS } from "./taxonomy";
import type { ModelRun } from "./triage";
import type { PublicUser, Ticket, TicketStatus, TriageRecord } from "./types";
import { technicians } from "./users";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

function fail(status: number, error: string): ActionResult<never> {
  return { ok: false, status, error };
}

function stamp(ticket: Ticket) {
  ticket.updatedAt = new Date().toISOString();
}

function pushHistory(
  ticket: Ticket,
  actor: PublicUser,
  action: string,
  fromStatus: TicketStatus | null,
  note: string,
) {
  ticket.history.push({
    id: randomUUID(),
    at: new Date().toISOString(),
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    fromStatus,
    toStatus: ticket.status,
    note,
  });
}

function recompute(ticket: Ticket) {
  if (["dispatched", "accepted", "processing", "completed"].includes(ticket.status)) return;
  if (ticket.confirmedTriageId) ticket.status = "confirmed";
  else if (ticket.triages.some((item) => item.ok)) ticket.status = "triaged";
  else ticket.status = "submitted";
}

function visibleCopy(user: PublicUser, ticket: Ticket): Ticket {
  if (user.role !== "student") return ticket;
  if (!ticket.confirmedTriageId) return { ...ticket, triages: [] };
  return {
    ...ticket,
    triages: ticket.triages.filter((item) => item.id === ticket.confirmedTriageId),
  };
}

export async function listTickets(user: PublicUser): Promise<Ticket[]> {
  return readStore()
    .tickets
    .filter((ticket) => canViewTicket(user, ticket))
    .map((ticket) => visibleCopy(user, ticket))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function getTicket(user: PublicUser, id: string): Promise<ActionResult<Ticket>> {
  const ticket = readStore().tickets.find((item) => item.id === id);
  if (!ticket || !canViewTicket(user, ticket)) return fail(404, "工单不存在");
  return { ok: true, data: visibleCopy(user, ticket) };
}

export async function submitTicket(
  user: PublicUser,
  input: { room?: string; device?: string; description?: string },
): Promise<ActionResult<Ticket>> {
  if (user.role !== "student") return fail(403, "只有学生可以提交报修");
  const room = input.room?.trim() ?? "";
  const device = input.device?.trim() ?? "";
  const description = input.description?.trim() ?? "";
  if (!ROOMS.includes(room as (typeof ROOMS)[number])) return fail(400, "请选择机房");
  if (device.length < 2 || device.length > 40) return fail(400, "设备名称需要 2 到 40 个字");
  if (description.length < 8 || description.length > 400) {
    return fail(400, "故障描述需要 8 到 400 个字");
  }
  return updateStore((store) => {
    const now = new Date().toISOString();
    const ticket: Ticket = {
      id: randomUUID(),
      no: `BX-${new Date().getFullYear()}-${String(store.seq).padStart(4, "0")}`,
      studentId: user.id,
      studentName: user.name,
      studentDetail: user.detail,
      room,
      device,
      description,
      status: "submitted",
      triages: [],
      confirmedTriageId: null,
      confirmedAt: null,
      confirmedById: null,
      confirmedByName: null,
      assigneeId: null,
      assigneeName: null,
      assigneePosition: null,
      dispatchedAt: null,
      createdAt: now,
      updatedAt: now,
      history: [],
    };
    store.seq += 1;
    pushHistory(ticket, user, "提交报修", null, `${room} · ${device}`);
    store.tickets.push(ticket);
    return { ok: true as const, data: ticket };
  });
}

export async function recordTriage(
  user: PublicUser,
  ticketId: string,
  run: ModelRun,
): Promise<ActionResult<Ticket>> {
  if (user.role !== "admin") return fail(403, "只有管理员可以分诊");
  return updateStore((store) => {
    const ticket = store.tickets.find((item) => item.id === ticketId);
    if (!ticket) return fail(404, "工单不存在");
    if (["dispatched", "accepted", "processing", "completed"].includes(ticket.status)) {
      return fail(400, "已经派发的工单不能再分诊");
    }
    const from = ticket.status;
    const record: TriageRecord = {
      id: randomUUID(),
      model: run.model,
      modelName: run.modelName,
      createdAt: new Date().toISOString(),
      actorId: user.id,
      actorName: user.name,
      ok: run.ok,
      error: run.error,
      tag: run.tag,
      urgency: run.urgency,
      position: run.position,
      reason: run.reason,
      raw: run.raw,
      latencyMs: run.latencyMs,
      httpStatus: run.httpStatus,
    };
    ticket.triages.push(record);
    recompute(ticket);
    stamp(ticket);
    const summary = run.ok
      ? `${run.modelName}：${run.tag} / ${run.urgency} / ${run.position}`
      : `${run.modelName} 调用失败：${run.error ?? "未知错误"}`;
    pushHistory(ticket, user, ticket.triages.length > 1 ? "重新分诊" : "分诊", from, summary);
    return { ok: true as const, data: ticket };
  });
}

export async function confirmTriage(
  user: PublicUser,
  ticketId: string,
  triageId: string,
): Promise<ActionResult<Ticket>> {
  if (user.role !== "admin") return fail(403, "只有管理员可以确认分诊");
  return updateStore((store) => {
    const ticket = store.tickets.find((item) => item.id === ticketId);
    if (!ticket) return fail(404, "工单不存在");
    if (["dispatched", "accepted", "processing", "completed"].includes(ticket.status)) {
      return fail(400, "已经派发的工单不能再改确认结果");
    }
    const triage = ticket.triages.find((item) => item.id === triageId);
    if (!triage || !triage.ok || !triage.tag || !triage.position) {
      return fail(400, "只能确认一次成功的分诊结果");
    }
    const from = ticket.status;
    ticket.confirmedTriageId = triage.id;
    ticket.confirmedAt = new Date().toISOString();
    ticket.confirmedById = user.id;
    ticket.confirmedByName = user.name;
    recompute(ticket);
    stamp(ticket);
    pushHistory(
      ticket,
      user,
      "确认分诊",
      from,
      `确认 ${triage.modelName} 的结果：${triage.position}`,
    );
    return { ok: true as const, data: ticket };
  });
}

export async function dispatchTicket(
  user: PublicUser,
  ticketId: string,
  technicianId: string,
): Promise<ActionResult<Ticket>> {
  if (user.role !== "admin") return fail(403, "只有管理员可以派发");
  const technician = technicians().find((item) => item.id === technicianId);
  if (!technician || !technician.position) return fail(400, "请选择维修人员");
  return updateStore((store) => {
    const ticket = store.tickets.find((item) => item.id === ticketId);
    if (!ticket) return fail(404, "工单不存在");
    const blocked = dispatchBlockReason(ticket);
    if (blocked) return fail(400, blocked);
    const confirmed = ticket.triages.find((item) => item.id === ticket.confirmedTriageId);
    if (!confirmed?.position) return fail(400, "确认结果缺少维修岗位");
    if (technician.position !== confirmed.position) {
      return fail(400, `该工单应派给${confirmed.position}`);
    }
    const from = ticket.status;
    ticket.status = "dispatched";
    ticket.assigneeId = technician.id;
    ticket.assigneeName = technician.name;
    ticket.assigneePosition = technician.position;
    ticket.dispatchedAt = new Date().toISOString();
    stamp(ticket);
    pushHistory(ticket, user, "派发", from, `派给${technician.name}（${technician.position}）`);
    return { ok: true as const, data: ticket };
  });
}

export async function transitionTicket(
  user: PublicUser,
  ticketId: string,
  action: "accept" | "start" | "complete",
  note?: string,
): Promise<ActionResult<Ticket>> {
  if (user.role !== "technician") return fail(403, "只有维修人员可以更新处理进度");
  return updateStore((store) => {
    const ticket = store.tickets.find((item) => item.id === ticketId);
    if (!ticket || ticket.assigneeId !== user.id) return fail(404, "工单不存在");
    const next = nextTechnicianStatus(ticket.status, action);
    if (!next) return fail(400, "当前状态不能做这一步");
    const from = ticket.status;
    ticket.status = next;
    stamp(ticket);
    const labels = { accept: "接单", start: "开始处理", complete: "完成" };
    const text = action === "complete" ? note?.trim() || "维修完成" : "";
    pushHistory(ticket, user, labels[action], from, text);
    return { ok: true as const, data: ticket };
  });
}
