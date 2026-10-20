import { notFound } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import type { Role } from "@/lib/types";
import { USERS } from "@/lib/users";

const roles: Role[] = ["student", "admin", "technician"];

export default async function LoginPage({ params }: { params: Promise<{ role: string }> }) {
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
