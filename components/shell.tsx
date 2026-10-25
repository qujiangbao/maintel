"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { BrandName } from "@/components/brand";
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
  const pathname = usePathname();
  const routerRef = useRef(router);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    let active = true;
    api<{ user: PublicUser }>("/api/auth/me")
      .then((data) => {
        if (!active) return;
        if (data.user.role !== role) {
          setDenied(true);
          routerRef.current.replace(`/login/${role}`);
          return;
        }
        setUser(data.user);
      })
      .catch(() => {
        if (!active) return;
        setDenied(true);
        routerRef.current.replace(`/login/${role}`);
      });
    return () => {
      active = false;
    };
  }, [role]);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.replace(`/login/${role}`);
  }

  if (!user) {
    return (
      <p className="px-6 py-16 text-sm text-muted-foreground">
        {denied ? <Link href={`/login/${role}`}>登录没有生效，返回登录页</Link> : "正在核对登录状态…"}
      </p>
    );
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
          <Link href="/" aria-label="澄川学院机务台">
            <BrandName />
          </Link>
          <nav className="flex flex-wrap gap-1 text-sm">
            {links[role].map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                {user.name.slice(0, 1)}
              </span>
              <span className="hidden sm:inline">
                <span className="mr-1.5 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                  {ROLE_LABEL[role]}
                </span>
                {user.name}
                <span className="text-muted-foreground"> {user.detail}</span>
              </span>
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="size-3.5" />
              退出
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
