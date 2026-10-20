import { NextResponse } from "next/server";
import { CASES } from "@/data/cases";
import { loadEvalView } from "@/lib/eval-report";
import { requireRole } from "@/lib/guard";

export async function GET() {
  const auth = await requireRole("admin");
  if (auth.response) return auth.response;
  const view = loadEvalView();
  if (!view) {
    return NextResponse.json({
      ready: false,
      caseCount: CASES.length,
      message: "尚未完成一次真实模型调用，页面不显示预置准确率。",
    });
  }
  return NextResponse.json(view);
}
