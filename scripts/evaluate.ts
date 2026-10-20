import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import path from "path";
import { CASES } from "../data/cases";
import { evalReportPath, type EvalFile } from "../lib/eval-report";
import { runModel, MissingKeyError, modelCatalog } from "../lib/triage";
import type { ModelOutcome } from "../lib/scoring";

loadEnv();

type Progress = EvalFile["results"];

const progressPath = path.join(process.cwd(), "data", "eval-progress.json");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function toOutcome(run: Awaited<ReturnType<typeof runModel>>): ModelOutcome {
  return {
    ok: run.ok,
    tag: run.tag ?? null,
    urgency: run.urgency ?? null,
    position: run.position ?? null,
    error: run.error ?? null,
    httpStatus: run.httpStatus ?? null,
    raw: run.raw,
    reason: run.reason ?? null,
    latencyMs: run.latencyMs,
    modelName: run.modelName,
  };
}

async function main() {
  const catalog = modelCatalog();
  const missing = catalog.filter((item) => !item.configured);
  if (missing.length > 0) {
    console.error(
      `缺少服务器密钥：${missing.map((item) => item.envName).join("、")}。未调用接口，不写准确率。`,
    );
    process.exit(1);
  }

  const progress: Progress = existsSync(progressPath)
    ? (JSON.parse(readFileSync(progressPath, "utf8")) as Progress)
    : [];
  const done = new Set(progress.map((item) => item.caseId));
  const pending = CASES.filter((item) => !done.has(item.id));
  console.log(`测试集 ${CASES.length} 条，已有进度 ${done.size} 条，待调用 ${pending.length} 条。`);

  let cursor = 0;
  const workers = Array.from({ length: 3 }, async () => {
    while (cursor < pending.length) {
      const index = cursor;
      cursor += 1;
      const item = pending[index];
      const deepseek = toOutcome(
        await runModel("deepseek", {
          room: item.room,
          device: item.device,
          description: item.description,
        }),
      );
      const zhipu = toOutcome(
        await runModel("zhipu", {
          room: item.room,
          device: item.device,
          description: item.description,
        }),
      );
      progress.push({ caseId: item.id, deepseek, zhipu });
      mkdirSync(path.dirname(progressPath), { recursive: true });
      writeFileSync(progressPath, JSON.stringify(progress, null, 2));
      console.log(
        `${progress.length}/${CASES.length} ${item.id} deepseek=${deepseek.ok ? deepseek.tag : "fail"} zhipu=${zhipu.ok ? zhipu.tag : "fail"}`,
      );
    }
  });
  await Promise.all(workers);

  if (progress.length < CASES.length) {
    console.error("调用未完成，不生成正式统计。");
    process.exit(1);
  }

  const models = modelCatalog();
  const report: EvalFile = {
    complete: true,
    generatedAt: new Date().toISOString(),
    deepseekModel: models.find((item) => item.id === "deepseek")?.modelName ?? "",
    zhipuModel: models.find((item) => item.id === "zhipu")?.modelName ?? "",
    results: progress,
  };
  writeFileSync(evalReportPath(), JSON.stringify(report, null, 2));
  if (existsSync(progressPath)) unlinkSync(progressPath);
  console.log(`已写入 ${evalReportPath()}。准确率请由页面或评分函数按逐条结果计算。`);
}

main().catch((error) => {
  if (error instanceof MissingKeyError) {
    console.error(error.message);
    process.exit(1);
  }
  console.error(error);
  process.exit(1);
});
