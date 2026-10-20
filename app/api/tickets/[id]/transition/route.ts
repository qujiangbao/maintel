import { NextResponse } from "next/server";
import { actionResponse, requireRole } from "@/lib/guard";
import { transitionTicket } from "@/lib/tickets";

const ACTIONS = ["accept", "start", "complete"] as const;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("technician");
  if (auth.response) return auth.response;
  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    note?: unknown;
  } | null;
  if (!body || !ACTIONS.includes(body.action as (typeof ACTIONS)[number])) {
    return NextResponse.json({ error: "无法识别的处理动作" }, { status: 400 });
  }
  const { id } = await context.params;
  return actionResponse(
    await transitionTicket(
      auth.user,
      id,
      body.action as (typeof ACTIONS)[number],
      typeof body.note === "string" ? body.note : undefined,
    ),
  );
}
