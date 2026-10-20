import { NextResponse } from "next/server";
import { actionResponse, requireRole } from "@/lib/guard";
import { listTickets, submitTicket } from "@/lib/tickets";

export async function GET() {
  const auth = await requireRole();
  if (auth.response) return auth.response;
  return NextResponse.json({ tickets: await listTickets(auth.user) });
}

export async function POST(request: Request) {
  const auth = await requireRole("student");
  if (auth.response) return auth.response;
  const body = (await request.json().catch(() => null)) as {
    room?: string;
    device?: string;
    description?: string;
  } | null;
  const result = await submitTicket(auth.user, body ?? {});
  return actionResponse(result);
}
