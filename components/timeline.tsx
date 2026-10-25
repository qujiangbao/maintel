import { statusDot } from "@/components/badges";
import { ROLE_LABEL, STATUS_LABEL, formatTime } from "@/lib/format";
import type { HistoryEvent } from "@/lib/types";

export function Timeline({ events }: { events: HistoryEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">还没有处理记录。</p>;
  }
  return (
    <ol className="relative space-y-5 border-l border-foreground/10 pl-5">
      {events.map((event) => (
        <li key={event.id} className="relative text-sm">
          <span
            className={`absolute top-1.5 -left-[1.65rem] size-2.5 rounded-full ring-4 ring-card ${statusDot(event.toStatus)}`}
          />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="font-medium">{event.action}</p>
            <p className="text-xs text-muted-foreground">
              {ROLE_LABEL[event.actorRole]} {event.actorName} · {formatTime(event.at)}
            </p>
          </div>
          <p className="mt-0.5 text-muted-foreground">
            {event.fromStatus ? `${STATUS_LABEL[event.fromStatus]} → ` : ""}
            {STATUS_LABEL[event.toStatus]}
            {event.note ? ` · ${event.note}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
