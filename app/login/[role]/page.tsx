import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import type { Role } from "@/lib/types";
import { USERS } from "@/lib/users";

const roles: Role[] = ["student", "admin", "technician"];

export default function Page({ params }: { params: Promise<{ role: string }> }) {
  return (
    <Suspense fallback={<p className="px-6 py-16 text-sm text-muted-foreground">正在打开登录页…</p>}>
      <LoginRoute params={params} />
    </Suspense>
  );
}

async function LoginRoute({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (!roles.includes(role as Role)) notFound();
  const accounts = USERS.filter((user) => user.role === role).map((user) => ({
    username: user.username,
    password: user.password,
    name: user.name,
    detail: user.detail,
  }));
  return <LoginForm role={role as Role} accounts={accounts} />;
}
