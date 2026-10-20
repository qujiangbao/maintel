import type { Role, TicketStatus, Urgency } from "./types";
import { tagById } from "./taxonomy";
import type { TagId } from "./types";

export const STATUS_LABEL: Record<TicketStatus, string> = {
  submitted: "待分诊",
  triaged: "待确认",
  confirmed: "待派发",
  dispatched: "已派发",
  accepted: "已接单",
  processing: "处理中",
  completed: "已完成",
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  low: "一般",
  medium: "较急",
  high: "紧急",
  critical: "特急",
};

export const ROLE_LABEL: Record<Role, string> = {
  student: "学生",
  admin: "管理员",
  technician: "维修人员",
};

export function tagLabel(id: TagId): string {
  return tagById(id).name;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRate(hits: number, total: number): string {
  if (total <= 0) return "—";
  const percent = ((hits / total) * 100).toFixed(1);
  return `${hits}/${total}（${percent}%）`;
}
