"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge, TagBadge, UrgencyBadge } from "@/components/badges";
import { Shell } from "@/components/shell";
import { Timeline } from "@/components/timeline";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client";
import type { Ticket } from "@/lib/types";

export default function TechTicketPage() {
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api<Ticket>(`/api/tickets/${params.id}`)
      .then(setTicket)
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  async function act(action: "accept" | "start" | "complete") {
    setPending(true);
    try {
      const next = await api<Ticket>(`/api/tickets/${params.id}/transition`, {
        method: "POST",
        body: JSON.stringify({ action, note }),
      });
      setTicket(next);
      toast.success("进度已更新");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新失败");
    } finally {
      setPending(false);
    }
  }

  const confirmed = ticket?.triages.find((item) => item.id === ticket.confirmedTriageId);

  return (
    <Shell role="technician">
      <Link href="/tech" className="text-sm text-muted-foreground">
        返回我的工单
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
                <dt className="text-muted-foreground">机房 / 设备</dt>
                <dd>
                  {ticket.room} · {ticket.device}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">故障描述</dt>
                <dd className="leading-6">{ticket.description}</dd>
              </div>
            </dl>
            {confirmed?.tag && confirmed.urgency ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <TagBadge tag={confirmed.tag} />
                <UrgencyBadge urgency={confirmed.urgency} />
                <span className="text-sm">{confirmed.position}</span>
              </div>
            ) : null}
            <div className="mt-5 space-y-3">
              {ticket.status === "dispatched" ? (
                <Button type="button" disabled={pending} onClick={() => act("accept")}>
                  接单
                </Button>
              ) : null}
              {ticket.status === "accepted" ? (
                <Button type="button" disabled={pending} onClick={() => act("start")}>
                  开始处理
                </Button>
              ) : null}
              {ticket.status === "processing" ? (
                <>
                  <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="处理说明，例如更换了网线" />
                  <Button type="button" disabled={pending} onClick={() => act("complete")}>
                    完成
                  </Button>
                </>
              ) : null}
              {ticket.status === "completed" ? <p className="text-sm text-muted-foreground">这张工单已经完成，记录保留在右侧。</p> : null}
            </div>
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
