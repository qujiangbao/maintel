"use client";

import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { Shell } from "@/components/shell";
import { TicketCard } from "@/components/ticket-card";
import { api } from "@/lib/client";
import { STATUS_LABEL } from "@/lib/format";
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
  const countFor = (id: (typeof filters)[number]["id"]) =>
    id === "all" ? (tickets?.length ?? 0) : (tickets?.filter((t) => t.status === id).length ?? 0);
  const awaitingConfirm = tickets?.filter((t) => t.status === "submitted" || t.status === "triaged").length ?? 0;

  return (
    <Shell role="admin">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tight">报修工单</h1>
          <p className="mt-1 text-sm text-muted-foreground">先分诊，再确认，然后才能派给维修人员。</p>
        </div>
        {tickets && awaitingConfirm > 0 ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-amber-300/60">
            {awaitingConfirm} 张待分诊确认
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((item) => {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card ring-1 ring-foreground/10 hover:ring-ring/50"
              }`}
            >
              {item.label}
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${
                  active ? "bg-white/20" : "bg-muted text-muted-foreground"
                }`}
              >
                {countFor(item.id)}
              </span>
            </button>
          );
        })}
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {tickets === null && !error ? <p className="mt-4 text-sm text-muted-foreground">正在读取工单…</p> : null}
      {tickets?.length === 0 ? (
        <div className="panel mt-6 flex flex-col items-center px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Inbox className="size-6" />
          </span>
          <p className="mt-4 text-sm font-medium">还没有学生报修</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">用学生入口提交后，工单会出现在这里。</p>
        </div>
      ) : null}
      {tickets && tickets.length > 0 && visible.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">这个状态下没有工单。</p>
      ) : null}
      <div className="mt-4 grid gap-3">
        {visible.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            href={`/admin/tickets/${ticket.id}`}
            meta={`${ticket.studentName} · 分诊 ${ticket.triages.length} 次`}
          />
        ))}
      </div>
    </Shell>
  );
}
