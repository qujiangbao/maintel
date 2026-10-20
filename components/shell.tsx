"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";
import { ROLE_LABEL } from "@/lib/format";
import type { PublicUser, Role } from "@/lib/types";

const links: Record<Role, Array<{ href: string; label: string }>> = {
  student: [{ href: "/student", label: "我的报修" }],
  admin: [
    { href: "/admin", label: "工单" },
    { href: "/admin/taxonomy", label: "划分依据" },
    { href: "/admin/eval", label: "测试统计" },
  ],
  technician: [{ href: "/tech", label: "我的工单" }],
};

export function Shell({ role, children }: { role: Role; children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    let active = true;
    api<{ user: PublicUser }>("/api/auth/me")
      .then((data) => {
        if (!active) return;
        if (data.user.role !== role) {
          router.replace(`/login/${role}`);
          return;
        }
        setUser(data.user);
      })
      .catch(() => {
        if (active) router.replace(`/login/${role}`);
      });
    return () => {
      active = false;
    };
  }, [role, router]);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.replace(`/login/${role}`);
  }

  if (!user) {
    return <p className="px-6 py-16 text-sm text-muted-foreground">正在核对登录状态…</p>;
  }

  return (
    <div className="min-h-full">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <Link href="/" className="font-display text-lg">
            澄川学院机务台
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            {links[role].map((item) => (
              <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span>
              {ROLE_LABEL[role]} · {user.name}
              <span className="text-muted-foreground"> {user.detail}</span>
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              退出
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
