"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBadge, TagBadge, UrgencyBadge } from "@/components/badges";
import { Shell } from "@/components/shell";
import { Timeline } from "@/components/timeline";
import { api } from "@/lib/client";
import type { Ticket } from "@/lib/types";

export default function StudentTicketPage() {
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Ticket>(`/api/tickets/${params.id}`)
      .then(setTicket)
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  const confirmed = ticket?.triages.find((item) => item.id === ticket.confirmedTriageId);

  return (
    <Shell role="student">
      <Link href="/student" className="text-sm text-muted-foreground">
        返回我的报修
      </Link>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {!ticket && !error ? <p className="mt-4 text-sm text-muted-foreground">正在读取工单…</p> : null}
      {ticket ? (
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl">{ticket.no}</h1>
              <StatusBadge status={ticket.status} />
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">机房</dt>
                <dd>{ticket.room}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">设备</dt>
                <dd>{ticket.device}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">故障描述</dt>
                <dd className="leading-6">{ticket.description}</dd>
              </div>
            </dl>
            {confirmed?.tag && confirmed.urgency && confirmed.position ? (
              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
                <TagBadge tag={confirmed.tag} />
                <UrgencyBadge urgency={confirmed.urgency} />
                <span>{confirmed.position}</span>
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">管理员尚未确认分诊结果，维修人员还看不到这张工单。</p>
            )}
            {ticket.assigneeName ? (
              <p className="mt-3 text-sm">已派给 {ticket.assigneeName}（{ticket.assigneePosition}）</p>
            ) : null}
          </section>
          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-display text-xl">处理记录</h2>
            <div className="mt-4">
              <Timeline events={ticket.history} />
            </div>
          </section>
        </div>
      ) : null}
    </Shell>
  );
}
