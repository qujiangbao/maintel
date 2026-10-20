import { NextResponse } from "next/server";
import { actionResponse, requireRole } from "@/lib/guard";
import { dispatchTicket } from "@/lib/tickets";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("admin");
  if (auth.response) return auth.response;
  const body = (await request.json().catch(() => null)) as { technicianId?: unknown } | null;
  if (typeof body?.technicianId !== "string") {
    return NextResponse.json({ error: "请选择维修人员" }, { status: 400 });
  }
  const { id } = await context.params;
  return actionResponse(await dispatchTicket(auth.user, id, body.technicianId));
}
