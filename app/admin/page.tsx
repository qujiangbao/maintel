"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/badges";
import { Shell } from "@/components/shell";
import { api } from "@/lib/client";
import { STATUS_LABEL, formatTime } from "@/lib/format";
import type { Ticket, TicketStatus } from "@/lib/types";

const filters: Array<{ id: "all" | TicketStatus; label: string }> = [
  { id: "all", label: "全部" },
  { id: "submitted", label: STATUS_LABEL.submitted },
  { id: "triaged", label: STATUS_LABEL.triaged },
  { id: "confirmed", label: STATUS_LABEL.confirmed },
  { id: "dispatched", label: STATUS_LABEL.dispatched },
  { id: "processing", label: STATUS_LABEL.processing },
  { id: "completed", label: STATUS_LABEL.completed },
];

export default function AdminPage() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");

  useEffect(() => {
    api<{ tickets: Ticket[] }>("/api/tickets")
      .then((data) => setTickets(data.tickets))
      .catch((err: Error) => setError(err.message));
  }, []);

  const visible = tickets?.filter((ticket) => filter === "all" || ticket.status === filter) ?? [];

  return (
    <Shell role="admin">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">报修工单</h1>
          <p className="mt-1 text-sm text-muted-foreground">先分诊，再确认，然后才能派给维修人员。</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-3 py-1 text-sm ${filter === item.id ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-foreground/10"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {tickets === null && !error ? <p className="mt-4 text-sm text-muted-foreground">正在读取工单…</p> : null}
      {tickets?.length === 0 ? (
        <p className="mt-6 text-sm leading-6 text-muted-foreground">还没有学生报修。用学生入口提交后，工单会出现在这里。</p>
      ) : null}
      {tickets && tickets.length > 0 && visible.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">这个状态下没有工单。</p>
      ) : null}
      <div className="mt-4 space-y-3">
        {visible.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/admin/tickets/${ticket.id}`}
            className="block rounded-xl bg-card p-4 ring-1 ring-foreground/10 hover:bg-accent"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
                {ticket.no} · {ticket.room} · {ticket.device}
              </span>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{ticket.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {ticket.studentName} · {formatTime(ticket.updatedAt)} · 分诊 {ticket.triages.length} 次
            </p>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
