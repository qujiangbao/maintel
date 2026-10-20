"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/badges";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client";
import { formatTime } from "@/lib/format";
import { ROOMS } from "@/lib/taxonomy";
import type { Ticket } from "@/lib/types";

export default function StudentPage() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState("");
  const [room, setRoom] = useState<string>(ROOMS[0]);
  const [device, setDevice] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  async function load() {
    const data = await api<{ tickets: Ticket[] }>("/api/tickets");
    setTickets(data.tickets);
  }

  useEffect(() => {
    let active = true;
    api<{ tickets: Ticket[] }>("/api/tickets")
      .then((data) => {
        if (active) setTickets(data.tickets);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const ticket = await api<Ticket>("/api/tickets", {
        method: "POST",
        body: JSON.stringify({ room, device, description }),
      });
      setDevice("");
      setDescription("");
      toast.success(`已提交 ${ticket.no}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "提交失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <Shell role="student">
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <form onSubmit={onSubmit} className="h-fit space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <div>
            <h1 className="font-display text-2xl">提交报修</h1>
            <p className="mt-1 text-sm text-muted-foreground">写清机房、设备和故障现象。分诊由管理员确认后再派发。</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="room">机房</Label>
            <select id="room" className="field-select" value={room} onChange={(event) => setRoom(event.target.value)}>
              {ROOMS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="device">设备</Label>
            <input
              id="device"
              className="h-9 w-full rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="例如工位18主机"
              value={device}
              onChange={(event) => setDevice(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">故障描述</Label>
            <Textarea
              id="description"
              className="min-h-28"
              placeholder="发生了什么，是否正在上课"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "提交中…" : "提交报修"}
          </Button>
        </form>
        <section>
          <h2 className="font-display text-2xl">我的进度</h2>
          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
          {tickets === null && !error ? <p className="mt-4 text-sm text-muted-foreground">正在读取报修…</p> : null}
          {tickets?.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              还没有报修。提交后，待分诊、待确认、已派发和处理完成都会留在这张列表里。
            </p>
          ) : null}
          <div className="mt-4 space-y-3">
            {tickets?.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/student/tickets/${ticket.id}`}
                className="block rounded-xl bg-card p-4 ring-1 ring-foreground/10 hover:bg-accent"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {ticket.no} · {ticket.room}
                  </span>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="mt-2 text-sm">{ticket.device}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{ticket.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatTime(ticket.updatedAt)}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
