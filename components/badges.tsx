import { STATUS_LABEL, URGENCY_LABEL, tagLabel } from "@/lib/format";
import type { TagId, TicketStatus, Urgency } from "@/lib/types";

const statusStyle: Record<TicketStatus, { chip: string; dot: string }> = {
  submitted: { chip: "bg-stone-200/80 text-stone-800", dot: "bg-stone-500" },
  triaged: { chip: "bg-amber-100 text-amber-950", dot: "bg-amber-500" },
  confirmed: { chip: "bg-sky-100 text-sky-950", dot: "bg-sky-500" },
  dispatched: { chip: "bg-teal-100 text-teal-950", dot: "bg-teal-500" },
  accepted: { chip: "bg-cyan-100 text-cyan-950", dot: "bg-cyan-600" },
  processing: { chip: "bg-indigo-100 text-indigo-950", dot: "bg-indigo-500" },
  completed: { chip: "bg-emerald-100 text-emerald-950", dot: "bg-emerald-500" },
};

const urgencyStyle: Record<Urgency, { chip: string; dot: string }> = {
  low: { chip: "bg-stone-200/80 text-stone-800", dot: "bg-stone-500" },
  medium: { chip: "bg-amber-100 text-amber-950", dot: "bg-amber-500" },
  high: { chip: "bg-orange-100 text-orange-950", dot: "bg-orange-500" },
  critical: { chip: "bg-red-100 text-red-950", dot: "bg-red-500" },
};

function Chip({ chip, dot, children }: { chip: string; dot: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${chip}`}>
      <span className={`size-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const style = statusStyle[status];
  return <Chip chip={style.chip} dot={style.dot}>{STATUS_LABEL[status]}</Chip>;
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const style = urgencyStyle[urgency];
  return <Chip chip={style.chip} dot={style.dot}>{URGENCY_LABEL[urgency]}</Chip>;
}

export function TagBadge({ tag }: { tag: TagId }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground ring-1 ring-foreground/10">
      {tagLabel(tag)}
    </span>
  );
}

export function statusDot(status: TicketStatus): string {
  return statusStyle[status].dot;
}
