import { ROLE_LABEL, STATUS_LABEL, formatTime } from "@/lib/format";
import type { HistoryEvent } from "@/lib/types";

export function Timeline({ events }: { events: HistoryEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">还没有处理记录。</p>;
  }
  return (
    <ol className="space-y-4">
      {events.map((event) => (
        <li key={event.id} className="grid grid-cols-[7rem_1fr] gap-3 text-sm">
          <time className="text-muted-foreground">{formatTime(event.at)}</time>
          <div>
            <p className="font-medium">
              {event.action}
              <span className="ml-2 font-normal text-muted-foreground">
                {ROLE_LABEL[event.actorRole]} {event.actorName}
              </span>
            </p>
            <p className="text-muted-foreground">
              {event.fromStatus ? `${STATUS_LABEL[event.fromStatus]} → ` : ""}
              {STATUS_LABEL[event.toStatus]}
              {event.note ? ` · ${event.note}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
