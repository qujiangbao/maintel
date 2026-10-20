"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client";
import { ROLE_LABEL } from "@/lib/format";
import type { Role } from "@/lib/types";

const home: Record<Role, string> = {
  student: "/student",
  admin: "/admin",
  technician: "/tech",
};

const copy: Record<Role, string> = {
  student: "提交机房报修，并查看自己的处理进度。",
  admin: "选择模型分诊。确认之前，工单不会派给维修人员。",
  technician: "只接收已经派发到本岗位的工单。",
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
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password, role }),
      });
      router.push(home[role]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground">
        返回入口
      </Link>
      <h1 className="font-display mt-6 text-3xl">{ROLE_LABEL[role]}登录</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy[role]}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">账号</Label>
          <Input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "正在登录…" : "进入机务台"}
        </Button>
      </form>
      <div className="mt-8 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <p className="text-sm font-medium">答辩演示账号</p>
        <ul className="mt-3 space-y-2 text-sm">
          {accounts.map((account) => (
            <li key={account.username} className="flex justify-between gap-3">
              <span>
                {account.name}
                <span className="text-muted-foreground"> · {account.detail}</span>
              </span>
              <button
                type="button"
                className="text-left text-primary"
                onClick={() => {
                  setUsername(account.username);
                  setPassword(account.password);
                }}
              >
                {account.username} / {account.password}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
