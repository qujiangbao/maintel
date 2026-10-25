"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, History, UserRoundCheck } from "lucide-react";
import { StatusBadge, TagBadge, UrgencyBadge } from "@/components/badges";
import { Shell } from "@/components/shell";
import { StatusSteps } from "@/components/status-steps";
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
      <Link
        href="/student"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        返回我的报修
      </Link>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {!ticket && !error ? <p className="mt-4 text-sm text-muted-foreground">正在读取工单…</p> : null}
      {ticket ? (
        <div className="mt-4 space-y-6">
          <section className="panel p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl tracking-tight">{ticket.no}</h1>
              <StatusBadge status={ticket.status} />
            </div>
            <div className="mt-5 overflow-x-auto pb-1">
              <StatusSteps status={ticket.status} />
            </div>
          </section>

          <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="panel p-5">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">机房</dt>
                  <dd className="mt-1 font-medium">{ticket.room}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">设备</dt>
                  <dd className="mt-1 font-medium">{ticket.device}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">故障描述</dt>
                  <dd className="mt-1 leading-6">{ticket.description}</dd>
                </div>
              </dl>
              <div className="mt-5 border-t border-border/70 pt-4">
                {confirmed?.tag && confirmed.urgency && confirmed.position ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <TagBadge tag={confirmed.tag} />
                    <UrgencyBadge urgency={confirmed.urgency} />
                    <span className="font-medium">{confirmed.position}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">管理员尚未确认分诊结果，维修人员还看不到这张工单。</p>
                )}
                {ticket.assigneeName ? (
                  <p className="mt-3 flex items-center gap-1.5 text-sm">
                    <UserRoundCheck className="size-4 text-primary" />
                    已派给 {ticket.assigneeName}（{ticket.assigneePosition}）
                  </p>
                ) : null}
              </div>
            </section>
            <section className="panel p-5">
              <h2 className="flex items-center gap-2 font-display text-xl tracking-tight">
                <History className="size-4.5 text-muted-foreground" />
                处理记录
              </h2>
              <div className="mt-4">
                <Timeline events={ticket.history} />
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
