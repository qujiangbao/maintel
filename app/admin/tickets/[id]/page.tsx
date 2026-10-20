"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge, TagBadge, UrgencyBadge } from "@/components/badges";
import { Shell } from "@/components/shell";
import { Timeline } from "@/components/timeline";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/client";
import { formatTime } from "@/lib/format";
import { positionFor } from "@/lib/taxonomy";
import type { ModelId, PublicUser, Ticket, TriageRecord } from "@/lib/types";

type ModelOption = {
  id: ModelId;
  label: string;
  modelName: string;
  configured: boolean;
  envName: string;
};

const locked = ["dispatched", "accepted", "processing", "completed"];

export default function AdminTicketPage() {
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [techs, setTechs] = useState<PublicUser[]>([]);
  const [error, setError] = useState("");
  const [model, setModel] = useState<ModelId>("deepseek");
  const [technicianId, setTechnicianId] = useState("");
  const [pending, setPending] = useState("");
  const [dispatchOpen, setDispatchOpen] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      api<Ticket>(`/api/tickets/${params.id}`),
      api<{ models: ModelOption[] }>("/api/models"),
      api<{ technicians: PublicUser[] }>("/api/technicians"),
    ])
      .then(([nextTicket, modelData, techData]) => {
        if (!active) return;
        setTicket(nextTicket);
        setModels(modelData.models);
        setTechs(techData.technicians);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  const selected = models.find((item) => item.id === model);
  const confirmed = ticket?.triages.find((item) => item.id === ticket.confirmedTriageId);
  const candidates = techs.filter((item) => item.position === confirmed?.position);
  const chosen = candidates.find((item) => item.id === technicianId) ?? candidates[0];
  const closed = ticket ? locked.includes(ticket.status) : false;

  async function triage() {
    setPending("triage");
    try {
      const next = await api<Ticket>(`/api/tickets/${params.id}/triage`, {
        method: "POST",
        body: JSON.stringify({ model }),
      });
      setTicket(next);
      toast.success(next.triages.at(-1)?.ok ? "分诊结果已保留" : "这次调用失败，记录已保留");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "分诊失败");
    } finally {
      setPending("");
    }
  }

  async function confirm(triageId: string) {
    setPending(triageId);
    try {
      setTicket(await api<Ticket>(`/api/tickets/${params.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({ triageId }),
      }));
      toast.success("已确认，现在可以派发");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "确认失败");
    } finally {
      setPending("");
    }
  }

  async function dispatch() {
    if (!chosen) return;
    setPending("dispatch");
    try {
      setTicket(await api<Ticket>(`/api/tickets/${params.id}/dispatch`, {
        method: "POST",
        body: JSON.stringify({ technicianId: chosen.id }),
      }));
      setDispatchOpen(false);
      toast.success(`已派给${chosen.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "派发失败");
    } finally {
      setPending("");
    }
  }

  return (
    <Shell role="admin">
      <Link href="/admin" className="text-sm text-muted-foreground">
        返回工单
      </Link>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {!ticket && !error ? <p className="mt-4 text-sm text-muted-foreground">正在读取工单…</p> : null}
      {ticket ? (
        <div className="mt-4 space-y-6">
          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl">{ticket.no}</h1>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {ticket.studentName} · {ticket.studentDetail} · {formatTime(ticket.createdAt)}
            </p>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">机房</dt>
                <dd>{ticket.room}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">设备</dt>
                <dd>{ticket.device}</dd>
              </div>
              <div className="sm:col-span-3">
                <dt className="text-muted-foreground">故障描述</dt>
                <dd className="leading-6">{ticket.description}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-display text-2xl">模型分诊</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              页面只选择模型。密钥放在服务器环境变量里，换模型会追加一条结果，不会覆盖上一次。
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                className="field-select sm:max-w-xs"
                value={model}
                onChange={(event) => setModel(event.target.value as ModelId)}
                disabled={closed}
              >
                {models.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label} · {item.modelName}
                    {item.configured ? "" : "（未配置密钥）"}
                  </option>
                ))}
              </select>
              <Button type="button" onClick={triage} disabled={closed || pending === "triage" || !selected?.configured}>
                {pending === "triage" ? "正在调用…" : ticket.triages.some((item) => item.model === model) ? "用该模型重新分诊" : "按所选模型分诊"}
              </Button>
            </div>
            {selected && !selected.configured ? (
              <p className="mt-3 text-sm text-destructive">服务器未配置 {selected.envName}，不能在页面填写密钥。</p>
            ) : null}
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {models.map((item) => (
                <div key={item.id}>
                  <h3 className="text-sm font-medium">{item.label}</h3>
                  <div className="mt-2 space-y-3">
                    {ticket.triages.filter((record) => record.model === item.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground">还没有这条模型的结果。</p>
                    ) : null}
                    {ticket.triages
                      .filter((record) => record.model === item.id)
                      .map((record) => (
                        <ResultCard
                          key={record.id}
                          record={record}
                          confirmed={record.id === ticket.confirmedTriageId}
                          disabled={closed || pending === record.id}
                          onConfirm={() => confirm(record.id)}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-display text-2xl">派发</h2>
            {!confirmed ? (
              <p className="mt-2 text-sm text-muted-foreground">管理员确认分诊结果之前，不能派给维修人员。</p>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-sm">
                  已确认 {confirmed.modelName} 的结果，岗位是 {confirmed.position}。
                </p>
                {ticket.assigneeName ? (
                  <p className="text-sm">已派给 {ticket.assigneeName}（{ticket.assigneePosition}）。</p>
                ) : (
                  <>
                    <select
                      className="field-select sm:max-w-xs"
                      value={chosen?.id ?? ""}
                      onChange={(event) => setTechnicianId(event.target.value)}
                    >
                      {candidates.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.position}
                        </option>
                      ))}
                    </select>
                    <div>
                      <Button type="button" disabled={!chosen} onClick={() => setDispatchOpen(true)}>
                        派发给维修人员
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-display text-xl">处理记录</h2>
            <div className="mt-4">
              <Timeline events={ticket.history} />
            </div>
          </section>

          <Dialog open={dispatchOpen} onOpenChange={setDispatchOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>确认派发</DialogTitle>
                <DialogDescription>
                  派给{chosen?.name}（{chosen?.position}）后，这张工单才会出现在维修人员的列表里。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDispatchOpen(false)}>
                  取消
                </Button>
                <Button type="button" onClick={dispatch} disabled={pending === "dispatch"}>
                  {pending === "dispatch" ? "派发中…" : "派发"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : null}
    </Shell>
  );
}

function ResultCard({
  record,
  confirmed,
  disabled,
  onConfirm,
}: {
  record: TriageRecord;
  confirmed: boolean;
  disabled: boolean;
  onConfirm: () => void;
}) {
  const mismatch =
    record.ok && record.tag && record.position && positionFor(record.tag) !== record.position;
  return (
    <article className={`rounded-lg p-3 ring-1 ${confirmed ? "ring-primary" : "ring-foreground/10"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {formatTime(record.createdAt)} · {record.latencyMs} ms
          {record.httpStatus ? ` · HTTP ${record.httpStatus}` : ""}
        </span>
        {confirmed ? <span className="text-primary">已确认</span> : null}
      </div>
      {record.ok && record.tag && record.urgency && record.position ? (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TagBadge tag={record.tag} />
            <UrgencyBadge urgency={record.urgency} />
            <span className="text-sm">{record.position}</span>
          </div>
          <p className="mt-2 text-sm leading-6">{record.reason}</p>
          {mismatch ? <p className="mt-2 text-xs text-destructive">岗位和标签映射不一致，确认前请再看一眼。</p> : null}
          <Button className="mt-3" type="button" size="sm" variant={confirmed ? "secondary" : "default"} disabled={disabled} onClick={onConfirm}>
            {confirmed ? "再次确认此结果" : "确认此结果"}
          </Button>
        </>
      ) : (
        <p className="mt-2 text-sm text-destructive">{record.error || "调用失败"}</p>
      )}
      {record.raw ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted-foreground">接口原文</summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{record.raw}</pre>
        </details>
      ) : null}
    </article>
  );
}
