import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/badges";
import { formatTime } from "@/lib/format";
import type { Ticket } from "@/lib/types";

export function TicketCard({
  ticket,
  href,
  meta,
}: {
  ticket: Ticket;
  href: string;
  meta?: string;
}) {
  return (
    <Link href={href} className="panel panel-hover group block p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium tracking-tight">
          {ticket.no}
          <span className="mx-1.5 text-muted-foreground">·</span>
          {ticket.device}
        </span>
        <span className="flex items-center gap-2">
          <StatusBadge status={ticket.status} />
          <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
        </span>
      </div>
      <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="size-3" />
        {ticket.room}
      </p>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{ticket.description}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {meta ? `${meta} · ` : ""}
        {formatTime(ticket.updatedAt)}
      </p>
    </Link>
  );
}
