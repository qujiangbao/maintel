import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guard";
import { modelCatalog } from "@/lib/triage";

export async function GET() {
  const auth = await requireRole("admin");
  if (auth.response) return auth.response;
  return NextResponse.json({
    models: modelCatalog().map((item) => ({
      id: item.id,
      label: item.label,
      modelName: item.modelName,
      configured: item.configured,
      envName: item.envName,
    })),
  });
}
