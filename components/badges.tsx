import { STATUS_LABEL, URGENCY_LABEL, tagLabel } from "@/lib/format";
import type { TagId, TicketStatus, Urgency } from "@/lib/types";

const statusClass: Record<TicketStatus, string> = {
  submitted: "bg-stone-200 text-stone-800",
  triaged: "bg-amber-100 text-amber-950",
  confirmed: "bg-sky-100 text-sky-950",
  dispatched: "bg-teal-100 text-teal-950",
  accepted: "bg-teal-200 text-teal-950",
  processing: "bg-indigo-100 text-indigo-950",
  completed: "bg-emerald-100 text-emerald-950",
};

const urgencyClass: Record<Urgency, string> = {
  low: "bg-stone-200 text-stone-800",
  medium: "bg-amber-100 text-amber-950",
  high: "bg-orange-100 text-orange-950",
  critical: "bg-red-100 text-red-950",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${urgencyClass[urgency]}`}>
      {URGENCY_LABEL[urgency]}
    </span>
  );
}

export function TagBadge({ tag }: { tag: TagId }) {
  return (
    <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
      {tagLabel(tag)}
    </span>
  );
}
