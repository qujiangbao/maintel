"use client";

import { useEffect, useState } from "react";
import { ClipboardList, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/shell";
import { TicketCard } from "@/components/ticket-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client";
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

  const activeCount = tickets?.filter((t) => t.status !== "completed").length ?? 0;
  const doneCount = tickets?.filter((t) => t.status === "completed").length ?? 0;

  return (
    <Shell role="student">
      <div className="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
        <form onSubmit={onSubmit} className="panel sticky top-20 space-y-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="size-5" />
            </span>
            <div>
              <h1 className="font-display text-xl tracking-tight">提交报修</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">分诊由管理员确认后再派发</p>
            </div>
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
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "提交中…" : "提交报修"}
            {!pending && <SendHorizontal className="size-4" />}
          </Button>
        </form>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl tracking-tight">我的进度</h2>
              <p className="mt-1 text-sm text-muted-foreground">待分诊、待确认、已派发和处理完成都会留在这里。</p>
            </div>
            {tickets && tickets.length > 0 ? (
              <div className="flex gap-2 text-xs">
                <span className="rounded-full bg-card px-2.5 py-1 ring-1 ring-foreground/10">
                  进行中 <b className="font-semibold text-foreground">{activeCount}</b>
                </span>
                <span className="rounded-full bg-card px-2.5 py-1 ring-1 ring-foreground/10">
                  已完成 <b className="font-semibold text-foreground">{doneCount}</b>
                </span>
              </div>
            ) : null}
          </div>
          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
          {tickets === null && !error ? <p className="mt-4 text-sm text-muted-foreground">正在读取报修…</p> : null}
          {tickets?.length === 0 ? (
            <div className="panel mt-4 flex flex-col items-center px-6 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <ClipboardList className="size-6" />
              </span>
              <p className="mt-4 text-sm font-medium">还没有报修</p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                左边填好机房、设备和故障现象，提交后进度会实时出现在这里。
              </p>
            </div>
          ) : null}
          <div className="mt-4 grid gap-3">
            {tickets?.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} href={`/student/tickets/${ticket.id}`} />
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
