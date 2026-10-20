import type { PublicUser, TicketStatus } from "./types";

const TECH_VISIBLE: TicketStatus[] = [
  "dispatched",
  "accepted",
  "processing",
  "completed",
];

export function canViewTicket(
  user: Pick<PublicUser, "id" | "role">,
  ticket: { studentId: string; assigneeId: string | null; status: TicketStatus },
): boolean {
  if (user.role === "admin") return true;
  if (user.role === "student") return ticket.studentId === user.id;
  return (
    ticket.assigneeId === user.id && TECH_VISIBLE.includes(ticket.status)
  );
}

export function dispatchBlockReason(ticket: {
  status: TicketStatus;
  confirmedTriageId: string | null;
}): string | null {
  if (!ticket.confirmedTriageId || ticket.status === "submitted" || ticket.status === "triaged") {
    return "管理员确认分诊结果之前，不能派给维修人员";
  }
  if (ticket.status !== "confirmed") {
    return "这张工单当前不能派发";
  }
  return null;
}

export function nextTechnicianStatus(
  status: TicketStatus,
  action: "accept" | "start" | "complete",
): TicketStatus | null {
  if (action === "accept" && status === "dispatched") return "accepted";
  if (action === "start" && status === "accepted") return "processing";
  if (action === "complete" && status === "processing") return "completed";
  return null;
}
