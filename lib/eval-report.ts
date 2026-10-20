import { existsSync, readFileSync } from "fs";
import path from "path";
import { CASES } from "@/data/cases";
import { scoreCases, type ModelOutcome, type ScoreSummary, type ScoredRow } from "./scoring";

export type EvalFile = {
  complete: boolean;
  generatedAt: string;
  deepseekModel: string;
  zhipuModel: string;
  results: Array<{
    caseId: string;
    deepseek: ModelOutcome;
    zhipu: ModelOutcome;
  }>;
};

export type EvalView = {
  ready: true;
  generatedAt: string;
  deepseekModel: string;
  zhipuModel: string;
  summary: ScoreSummary;
  rows: ScoredRow[];
};

export function evalReportPath(): string {
  return path.join(process.cwd(), "data", "eval-report.json");
}

export function loadEvalView(): EvalView | null {
  const file = evalReportPath();
  if (!existsSync(file)) return null;
  const report = JSON.parse(readFileSync(file, "utf8")) as EvalFile;
  if (!report.complete || !Array.isArray(report.results)) return null;
  const outputs = new Map(report.results.map((item) => [item.caseId, item]));
  const scored = scoreCases(CASES, outputs);
  return {
    ready: true,
    generatedAt: report.generatedAt,
    deepseekModel: report.deepseekModel,
    zhipuModel: report.zhipuModel,
    summary: scored.summary,
    rows: scored.rows,
  };
}
