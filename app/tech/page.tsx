"use client";

import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { Shell } from "@/components/shell";
import { TicketCard } from "@/components/ticket-card";
import { api } from "@/lib/client";
import type { Ticket } from "@/lib/types";

export default function TechPage() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ tickets: Ticket[] }>("/api/tickets")
      .then((data) => setTickets(data.tickets))
      .catch((err: Error) => setError(err.message));
  }, []);

  const openCount = tickets?.filter((t) => t.status !== "completed").length ?? 0;

  return (
    <Shell role="technician">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tight">我的工单</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            这里只有已经派给本岗位的报修。未确认、未派发的工单不会出现。
          </p>
        </div>
        {tickets && openCount > 0 ? (
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-950 ring-1 ring-teal-300/60">
            {openCount} 张待处理
          </span>
        ) : null}
      </div>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {tickets === null && !error ? <p className="mt-4 text-sm text-muted-foreground">正在读取工单…</p> : null}
      {tickets?.length === 0 ? (
        <div className="panel mt-6 flex flex-col items-center px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Wrench className="size-6" />
          </span>
          <p className="mt-4 text-sm font-medium">还没有派给你的工单</p>
          <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            学生提交和管理员分诊都不会直接出现在维修列表里，只有管理员确认并派发后才会出现。
          </p>
        </div>
      ) : null}
      <div className="mt-4 grid gap-3">
        {tickets?.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            href={`/tech/tickets/${ticket.id}`}
            meta={ticket.studentName}
          />
        ))}
      </div>
    </Shell>
  );
}
