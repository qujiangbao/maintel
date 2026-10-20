"use client";

import { useEffect, useState } from "react";
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
      <h1 className="font-display text-3xl">测试统计</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        测试集按机房场景写成模拟报修，每条带标准答案。准确率、失败案例和两模型不一致案例都从逐条接口结果现算，页面里没有写死的百分比。
      </p>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {!data && !error ? <p className="mt-4 text-sm text-muted-foreground">正在读取统计…</p> : null}
      {data && !data.ready ? (
        <section className="mt-6 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-sm leading-6">
            已写入 {data.caseCount} 条模拟报修和标准答案。{data.message}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            在服务器配置 DEEPSEEK_API_KEY 和 ZHIPU_API_KEY 后运行 <code>npm run eval</code>。脚本会真实调用两个接口，完成全部记录后才生成统计文件。
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
        <SummaryCard title="DeepSeek" summary={data.summary.deepseek} />
        <SummaryCard title="智谱 GLM" summary={data.summary.zhipu} />
      </div>
      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-display text-2xl">按标签的命中</h2>
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
      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-display text-2xl">两模型不一致</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {disagreements.length} 条。两边都成功返回，但标签、紧急程度或岗位不同。
        </p>
        {disagreements.length === 0 ? (
          <p className="mt-3 text-sm">这次调用没有不一致案例。</p>
        ) : (
          <div className="mt-4 space-y-3">
            {disagreements.map((row) => (
              <article key={row.caseId} className="rounded-lg p-3 ring-1 ring-foreground/10">
                <p className="text-sm font-medium">
                  {row.caseId} · {row.room} · {row.device}
                </p>
                <p className="mt-1 text-sm leading-6">{row.description}</p>
                <p className="mt-2 text-sm">
                  标准答案：{tagLabel(row.expected.tag)} / {URGENCY_LABEL[row.expected.urgency as Urgency]} / {row.expected.position}
                </p>
                <p className="text-sm text-muted-foreground">依据：{row.basis}</p>
                <p className="mt-2 text-sm">DeepSeek：{line(row.deepseek)}</p>
                <p className="text-sm">智谱：{line(row.zhipu)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-display text-2xl">失败案例</h2>
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

function SummaryCard({ title, summary }: { title: string; summary: ScoreSummary["deepseek"] }) {
  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-display text-2xl">{title}</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-3"><dt>标签准确率</dt><dd>{formatRate(summary.tagHits, summary.calls)}</dd></div>
        <div className="flex justify-between gap-3"><dt>紧急程度准确率</dt><dd>{formatRate(summary.urgencyHits, summary.calls)}</dd></div>
        <div className="flex justify-between gap-3"><dt>岗位准确率</dt><dd>{formatRate(summary.positionHits, summary.calls)}</dd></div>
        <div className="flex justify-between gap-3"><dt>三项全对</dt><dd>{formatRate(summary.fullHits, summary.calls)}</dd></div>
        <div className="flex justify-between gap-3"><dt>接口失败</dt><dd>{summary.httpFailures}</dd></div>
        <div className="flex justify-between gap-3"><dt>解析失败</dt><dd>{summary.parseFailures}</dd></div>
        <div className="flex justify-between gap-3"><dt>判定不符</dt><dd>{summary.mismatches}</dd></div>
      </dl>
    </section>
  );
}

function line(outcome: ScoredRow["deepseek"]) {
  if (!outcome.tag || !outcome.urgency || !outcome.position) return outcome.error || "无结果";
  return `${tagLabel(outcome.tag as TagId)} / ${URGENCY_LABEL[outcome.urgency as Urgency]} / ${outcome.position}`;
}
