"use client";

import { useEffect, useState } from "react";
import { ChartColumn, Scale, Split, TriangleAlert } from "lucide-react";
import { Shell } from "@/components/shell";
import { api } from "@/lib/client";
import { URGENCY_LABEL, formatRate, formatTime, tagLabel } from "@/lib/format";
import type { ScoreSummary, ScoredRow } from "@/lib/scoring";
import type { TagId, Urgency } from "@/lib/types";

type EvalResponse =
  | { ready: false; caseCount: number; message: string }
  | {
      ready: true;
      generatedAt: string;
      deepseekModel: string;
      zhipuModel: string;
      summary: ScoreSummary;
      rows: ScoredRow[];
    };

export default function EvalPage() {
  const [data, setData] = useState<EvalResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<EvalResponse>("/api/eval")
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <Shell role="admin">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ChartColumn className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-3xl tracking-tight">测试统计</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">逐条真实调用现算，没有写死的百分比</p>
        </div>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        测试集按机房场景写成模拟报修，每条带标准答案。准确率、失败案例和两模型不一致案例都从逐条接口结果现算，页面里没有写死的百分比。
      </p>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {!data && !error ? <p className="mt-4 text-sm text-muted-foreground">正在读取统计…</p> : null}
      {data && !data.ready ? (
        <section className="panel mt-6 p-5">
          <p className="text-sm leading-6">
            已写入 {data.caseCount} 条模拟报修和标准答案。{data.message}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            在服务器配置 DEEPSEEK_API_KEY 和 ZHIPU_API_KEY 后运行 <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npm run eval</code>。脚本会真实调用两个接口，完成全部记录后才生成统计文件。
          </p>
        </section>
      ) : null}
      {data && data.ready ? <Report data={data} /> : null}
    </Shell>
  );
}

function Report({
  data,
}: {
  data: Extract<EvalResponse, { ready: true }>;
}) {
  const failures = data.rows.flatMap((row) => {
    const items: Array<{ row: ScoredRow; model: string; kind: string; outcome: ScoredRow["deepseek"] }> = [];
    if (row.deepseekJudge.failed && row.deepseekJudge.failureKind) {
      items.push({ row, model: "DeepSeek", kind: row.deepseekJudge.failureKind, outcome: row.deepseek });
    }
    if (row.zhipuJudge.failed && row.zhipuJudge.failureKind) {
      items.push({ row, model: "智谱", kind: row.zhipuJudge.failureKind, outcome: row.zhipu });
    }
    return items;
  });
  const disagreements = data.rows.filter((row) => row.disagree);

  return (
    <div className="mt-6 space-y-6">
      <p className="text-sm text-muted-foreground">
        统计时间 {formatTime(data.generatedAt)}。模型 {data.deepseekModel} 与 {data.zhipuModel}。分母是测试集 {data.summary.caseCount} 条，失败也算进分母。
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard title="DeepSeek" summary={data.summary.deepseek} barClass="bg-chart-1" />
        <SummaryCard title="智谱 GLM" summary={data.summary.zhipu} barClass="bg-chart-4" />
      </div>
      <section className="panel p-5">
        <h2 className="flex items-center gap-2 font-display text-2xl tracking-tight">
          <Scale className="size-5 text-muted-foreground" />
          按标签的命中
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2 pr-3 font-medium">标签</th>
                <th className="py-2 pr-3 font-medium">DeepSeek 标签命中</th>
                <th className="py-2 font-medium">智谱标签命中</th>
              </tr>
            </thead>
            <tbody>
              {(["host", "display", "network", "media", "peripheral"] as TagId[]).map((tag) => {
                const subset = data.rows.filter((row) => row.expected.tag === tag);
                return (
                  <tr key={tag} className="border-t border-border">
                    <td className="py-2 pr-3">{tagLabel(tag)}</td>
                    <td className="py-2 pr-3">{formatRate(subset.filter((row) => row.deepseekJudge.tagMatch).length, subset.length)}</td>
                    <td className="py-2">{formatRate(subset.filter((row) => row.zhipuJudge.tagMatch).length, subset.length)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel p-5">
        <h2 className="flex items-center gap-2 font-display text-2xl tracking-tight">
          <Split className="size-5 text-muted-foreground" />
          两模型不一致
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {disagreements.length} 条。两边都成功返回，但标签、紧急程度或岗位不同。
        </p>
        {disagreements.length === 0 ? (
          <p className="mt-3 text-sm">这次调用没有不一致案例。</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {disagreements.map((row) => (
              <article key={row.caseId} className="rounded-lg p-3.5 ring-1 ring-foreground/10">
                <p className="text-sm font-medium">
                  {row.caseId} · {row.room} · {row.device}
                </p>
                <p className="mt-1 text-sm leading-6">{row.description}</p>
                <p className="mt-2 text-sm">
                  标准答案：{tagLabel(row.expected.tag)} / {URGENCY_LABEL[row.expected.urgency as Urgency]} / {row.expected.position}
                </p>
                <p className="text-sm text-muted-foreground">依据：{row.basis}</p>
                <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                  <p><span className="font-medium">DeepSeek：</span>{line(row.deepseek)}</p>
                  <p><span className="font-medium">智谱：</span>{line(row.zhipu)}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="panel p-5">
        <h2 className="flex items-center gap-2 font-display text-2xl tracking-tight">
          <TriangleAlert className="size-5 text-muted-foreground" />
          失败案例
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{failures.length} 条模型结果未与标准答案完全一致，或调用没有成功。</p>
        {failures.length === 0 ? (
          <p className="mt-3 text-sm">这次调用没有失败案例。</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-medium">编号</th>
                  <th className="py-2 pr-3 font-medium">模型</th>
                  <th className="py-2 pr-3 font-medium">类型</th>
                  <th className="py-2 pr-3 font-medium">标准答案</th>
                  <th className="py-2 font-medium">实际结果</th>
                </tr>
              </thead>
              <tbody>
                {failures.map((item) => (
                  <tr key={`${item.row.caseId}-${item.model}`} className="border-t border-border align-top">
                    <td className="py-2 pr-3">{item.row.caseId}</td>
                    <td className="py-2 pr-3">{item.model}</td>
                    <td className="py-2 pr-3">{item.kind}</td>
                    <td className="py-2 pr-3">
                      {tagLabel(item.row.expected.tag)} / {URGENCY_LABEL[item.row.expected.urgency as Urgency]} / {item.row.expected.position}
                      <span className="mt-1 block text-muted-foreground">{item.row.description}</span>
                    </td>
                    <td className="py-2">{item.outcome.ok ? line(item.outcome) : item.outcome.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function RateRow({ label, hits, total, barClass }: { label: string; hits: number; total: number; barClass: string }) {
  const pct = total > 0 ? Math.round((hits / total) * 1000) / 10 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <dt>{label}</dt>
        <dd className="tabular-nums">{formatRate(hits, total)}</dd>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SummaryCard({ title, summary, barClass }: { title: string; summary: ScoreSummary["deepseek"]; barClass: string }) {
  return (
    <section className="panel p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">
          三项全对 <span className="font-semibold text-foreground">{formatRate(summary.fullHits, summary.calls)}</span>
        </p>
      </div>
      <dl className="mt-4 space-y-3 text-sm">
        <RateRow label="标签准确率" hits={summary.tagHits} total={summary.calls} barClass={barClass} />
        <RateRow label="紧急程度准确率" hits={summary.urgencyHits} total={summary.calls} barClass={barClass} />
        <RateRow label="岗位准确率" hits={summary.positionHits} total={summary.calls} barClass={barClass} />
        <RateRow label="三项全对" hits={summary.fullHits} total={summary.calls} barClass={barClass} />
      </dl>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border/70 pt-3 text-center text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">接口失败</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">{summary.httpFailures}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">解析失败</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">{summary.parseFailures}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">判定不符</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">{summary.mismatches}</dd>
        </div>
      </dl>
    </section>
  );
}

function line(outcome: ScoredRow["deepseek"]) {
  if (!outcome.tag || !outcome.urgency || !outcome.position) return outcome.error || "无结果";
  return `${tagLabel(outcome.tag as TagId)} / ${URGENCY_LABEL[outcome.urgency as Urgency]} / ${outcome.position}`;
}
