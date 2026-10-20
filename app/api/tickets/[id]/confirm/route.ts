import { NextResponse } from "next/server";
import { actionResponse, requireRole } from "@/lib/guard";
import { confirmTriage } from "@/lib/tickets";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("admin");
  if (auth.response) return auth.response;
  const body = (await request.json().catch(() => null)) as { triageId?: unknown } | null;
  if (typeof body?.triageId !== "string") {
    return NextResponse.json({ error: "请选择要确认的分诊结果" }, { status: 400 });
  }
  const { id } = await context.params;
  return actionResponse(await confirmTriage(auth.user, id, body.triageId));
}
