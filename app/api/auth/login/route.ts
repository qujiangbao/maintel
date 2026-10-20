import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";
import type { Role } from "@/lib/types";
import { authenticate, toPublicUser } from "@/lib/users";

const ROLES: Role[] = ["student", "admin", "technician"];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    username?: unknown;
    password?: unknown;
    role?: unknown;
  } | null;
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!body || !ROLES.includes(body.role as Role)) {
    return NextResponse.json({ error: "请从对应入口登录" }, { status: 400 });
  }
  const result = authenticate(username, password, body.role as Role);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(result.user.id), sessionCookieOptions());
  return NextResponse.json({ user: toPublicUser(result.user) });
}
