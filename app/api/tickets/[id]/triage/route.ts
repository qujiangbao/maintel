import { NextResponse } from "next/server";
import { actionResponse, requireRole } from "@/lib/guard";
import { getTicket, recordTriage } from "@/lib/tickets";
import { MissingKeyError, assertModel, runModel } from "@/lib/triage";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("admin");
  if (auth.response) return auth.response;
  const body = (await request.json().catch(() => null)) as { model?: unknown } | null;
  let model: ReturnType<typeof assertModel>;
  try {
    model = assertModel(String(body?.model ?? ""));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "只能选择 DeepSeek 或智谱" },
      { status: 400 },
    );
  }
  const { id } = await context.params;
  const existing = await getTicket(auth.user, id);
  if (!existing.ok) return actionResponse(existing);
  try {
    const run = await runModel(model, {
      room: existing.data.room,
      device: existing.data.device,
      description: existing.data.description,
    });
    return actionResponse(await recordTriage(auth.user, id, run));
  } catch (error) {
    if (error instanceof MissingKeyError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
