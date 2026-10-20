import { NextResponse } from "next/server";
import { currentUser } from "./session";
import type { PublicUser, Role } from "./types";

export async function requireRole(
  role?: Role,
): Promise<{ user: PublicUser; response?: undefined } | { user?: undefined; response: NextResponse }> {
  const user = await currentUser();
  if (!user) {
    return { response: NextResponse.json({ error: "请先登录" }, { status: 401 }) };
  }
  if (role && user.role !== role) {
    return { response: NextResponse.json({ error: "当前账号没有这个权限" }, { status: 403 }) };
  }
  return { user };
}

export function actionResponse<T>(result: { ok: true; data: T } | { ok: false; status: number; error: string }) {
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result.data);
}
