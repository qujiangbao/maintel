"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CircleAlert } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client";
import { ROLE_LABEL } from "@/lib/format";
import type { Role } from "@/lib/types";

const home: Record<Role, string> = {
  student: "/student",
  admin: "/admin",
  technician: "/tech",
};

const copy: Record<Role, { title: string; hint: string; mark: string }> = {
  student: {
    title: "同学，登录后报修",
    hint: "提交机房报修，并查看自己的处理进度。",
    mark: "学",
  },
  admin: {
    title: "管理员工作台",
    hint: "选择模型分诊。确认之前，工单不会派给维修人员。",
    mark: "管",
  },
  technician: {
    title: "维修人员入口",
    hint: "只接收已经派发到本岗位的工单。",
    mark: "修",
  },
};

export function LoginForm({
  role,
  accounts,
}: {
  role: Role;
  accounts: Array<{ username: string; password: string; name: string; detail: string }>;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(accounts[0]?.username ?? "");
  const [password, setPassword] = useState(accounts[0]?.password ?? "");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const meta = copy[role];

  async function loginWith(nextUsername: string, nextPassword: string) {
    setUsername(nextUsername);
    setPassword(nextPassword);
    setPending(true);
    setError("");
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: nextUsername, password: nextPassword, role }),
      });
      router.push(home[role]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    await loginWith(username, password);
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <div className="hero-grid relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <Link href="/" className="flex w-fit items-center gap-2.5">
          <BrandMark className="size-9 bg-white/12 text-white" />
          <span className="font-mono text-sm tracking-widest">机务台 · LAB DESK</span>
        </Link>
        <div>
          <p className="text-xs tracking-[0.2em] text-white/45">{ROLE_LABEL[role]}入口</p>
          <h1 className="mt-3 max-w-md text-balance font-display text-4xl tracking-tight text-white">
            {meta.title}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/55">{meta.hint}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/40">
          <span className="grid size-12 place-items-center rounded-xl bg-white/8 font-mono text-xl font-bold text-white/70">
            {meta.mark}
          </span>
          <p className="max-w-64 leading-relaxed">登录即代表同意：故障描述可能被提交给所选大模型用于分诊。</p>
        </div>
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -top-16 right-16 size-48 rounded-full bg-white/4" />
      </div>

      <div className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <BrandMark className="size-8" />
            <span className="font-display text-lg tracking-tight">机务台</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            返回入口
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground">{ROLE_LABEL[role]}</p>
          <h2 className="mt-2 font-display text-3xl tracking-tight">{ROLE_LABEL[role]}登录</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">演示账号密码均为 lab2023，点下方账号一键登录。</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">账号</Label>
              <input
                id="username"
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                autoComplete="username"
                placeholder={role === "student" ? "学号，如 2023001" : "工号"}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <input
                id="password"
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                type="password"
                autoComplete="current-password"
                placeholder="请输入密码"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? (
              <p className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <CircleAlert className="size-4 shrink-0" />
                {error}
              </p>
            ) : null}
            <Button type="submit" className="h-10 w-full" disabled={pending}>
              {pending ? "正在登录…" : "进入机务台"}
              {!pending && <ArrowRight className="size-4" />}
            </Button>
          </form>

          <div className="mt-8">
            <p className="mb-2.5 text-xs text-muted-foreground">答辩演示账号（点击直接登录）</p>
            <div className="grid gap-2">
              {accounts.map((account) => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => loginWith(account.username, account.password)}
                  className="group flex items-center justify-between rounded-xl bg-card px-3.5 py-2.5 text-left ring-1 ring-foreground/10 transition-all hover:-translate-y-px hover:ring-ring/50 hover:shadow-sm"
                >
                  <span>
                    <span className="block text-sm font-medium">
                      {account.name}
                      <span className="font-normal text-muted-foreground"> · {account.detail}</span>
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {account.username} / {account.password}
                    </span>
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
