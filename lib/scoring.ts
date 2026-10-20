import type { RepairCase } from "./types";

export type ModelOutcome = {
  ok: boolean;
  tag?: string | null;
  urgency?: string | null;
  position?: string | null;
  error?: string | null;
  httpStatus?: number | null;
  raw?: string | null;
  reason?: string | null;
  latencyMs?: number;
  modelName?: string;
};

export type Judgement = {
  tagMatch: boolean;
  urgencyMatch: boolean;
  positionMatch: boolean;
  fullMatch: boolean;
  failed: boolean;
  failureKind: "接口失败" | "解析失败" | "判定不符" | null;
};

export function judge(expected: Pick<RepairCase, "tag" | "urgency" | "position">, outcome: ModelOutcome): Judgement {
  if (!outcome.ok) {
    const failureKind =
      outcome.error && /JSON|解析|字段|标签|紧急程度|岗位/.test(outcome.error)
        ? "解析失败"
        : "接口失败";
    return {
      tagMatch: false,
      urgencyMatch: false,
      positionMatch: false,
      fullMatch: false,
      failed: true,
      failureKind,
    };
  }
  const tagMatch = outcome.tag === expected.tag;
  const urgencyMatch = outcome.urgency === expected.urgency;
  const positionMatch = outcome.position === expected.position;
  const fullMatch = tagMatch && urgencyMatch && positionMatch;
  return {
    tagMatch,
    urgencyMatch,
    positionMatch,
    fullMatch,
    failed: !fullMatch,
    failureKind: fullMatch ? null : "判定不符",
  };
}

export type ScoredRow = {
  caseId: string;
  room: string;
  device: string;
  description: string;
  basis: string;
  expected: Pick<RepairCase, "tag" | "urgency" | "position">;
  deepseek: ModelOutcome;
  zhipu: ModelOutcome;
  deepseekJudge: Judgement;
  zhipuJudge: Judgement;
  disagree: boolean;
};

export type ModelSummary = {
  calls: number;
  tagHits: number;
  urgencyHits: number;
  positionHits: number;
  fullHits: number;
  httpFailures: number;
  parseFailures: number;
  mismatches: number;
};

export type ScoreSummary = {
  caseCount: number;
  deepseek: ModelSummary;
  zhipu: ModelSummary;
  disagreements: number;
};

function emptySummary(calls: number): ModelSummary {
  return {
    calls,
    tagHits: 0,
    urgencyHits: 0,
    positionHits: 0,
    fullHits: 0,
    httpFailures: 0,
    parseFailures: 0,
    mismatches: 0,
  };
}

function add(summary: ModelSummary, judgement: Judgement) {
  if (judgement.tagMatch) summary.tagHits += 1;
  if (judgement.urgencyMatch) summary.urgencyHits += 1;
  if (judgement.positionMatch) summary.positionHits += 1;
  if (judgement.fullMatch) summary.fullHits += 1;
  if (judgement.failureKind === "接口失败") summary.httpFailures += 1;
  if (judgement.failureKind === "解析失败") summary.parseFailures += 1;
  if (judgement.failureKind === "判定不符") summary.mismatches += 1;
}

export function disagrees(left: ModelOutcome, right: ModelOutcome): boolean {
  if (!left.ok || !right.ok) return false;
  return left.tag !== right.tag || left.urgency !== right.urgency || left.position !== right.position;
}

export function scoreCases(
  cases: RepairCase[],
  outputs: Map<string, { deepseek: ModelOutcome; zhipu: ModelOutcome }>,
): { rows: ScoredRow[]; summary: ScoreSummary } {
  const summary: ScoreSummary = {
    caseCount: cases.length,
    deepseek: emptySummary(cases.length),
    zhipu: emptySummary(cases.length),
    disagreements: 0,
  };
  const rows = cases.map((item) => {
    const output = outputs.get(item.id);
    const deepseek = output?.deepseek ?? { ok: false, error: "没有这条的调用记录" };
    const zhipu = output?.zhipu ?? { ok: false, error: "没有这条的调用记录" };
    const deepseekJudge = judge(item, deepseek);
    const zhipuJudge = judge(item, zhipu);
    const disagree = disagrees(deepseek, zhipu);
    add(summary.deepseek, deepseekJudge);
    add(summary.zhipu, zhipuJudge);
    if (disagree) summary.disagreements += 1;
    return {
      caseId: item.id,
      room: item.room,
      device: item.device,
      description: item.description,
      basis: item.basis,
      expected: { tag: item.tag, urgency: item.urgency, position: item.position },
      deepseek,
      zhipu,
      deepseekJudge,
      zhipuJudge,
      disagree,
    };
  });
  return { rows, summary };
}
