"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/badges";
import { Shell } from "@/components/shell";
import { api } from "@/lib/client";
import { formatTime } from "@/lib/format";
import type { Ticket } from "@/lib/types";

export default function TechPage() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ tickets: Ticket[] }>("/api/tickets")
      .then((data) => setTickets(data.tickets))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <Shell role="technician">
      <h1 className="font-display text-3xl">我的工单</h1>
      <p className="mt-2 text-sm text-muted-foreground">这里只有已经派给本岗位的报修。未确认、未派发的工单不会出现。</p>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {tickets === null && !error ? <p className="mt-4 text-sm text-muted-foreground">正在读取工单…</p> : null}
      {tickets?.length === 0 ? (
        <p className="mt-6 max-w-xl text-sm leading-6 text-muted-foreground">
          还没有派给你的工单。学生提交和管理员分诊都不会直接出现在维修列表里。
        </p>
      ) : null}
      <div className="mt-4 space-y-3">
        {tickets?.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/tech/tickets/${ticket.id}`}
            className="block rounded-xl bg-card p-4 ring-1 ring-foreground/10 hover:bg-accent"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
                {ticket.no} · {ticket.room} · {ticket.device}
              </span>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{ticket.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">{formatTime(ticket.updatedAt)}</p>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
