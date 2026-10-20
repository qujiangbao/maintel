import assert from "node:assert/strict";
import test from "node:test";
import { judge, scoreCases } from "./scoring";
import type { RepairCase } from "./types";

const sample: RepairCase[] = [
  {
    id: "A",
    room: "第一机房 A101",
    device: "主机",
    description: "开不了机",
    tag: "host",
    urgency: "medium",
    position: "主机维修岗",
    basis: "主机",
  },
  {
    id: "B",
    room: "第一机房 A101",
    device: "显示器",
    description: "花屏",
    tag: "display",
    urgency: "low",
    position: "显示维修岗",
    basis: "显示",
  },
];

test("准确率由逐条对错相加，不使用写死的百分比", () => {
  const { summary, rows } = scoreCases(
    sample,
    new Map([
      [
        "A",
        {
          deepseek: { ok: true, tag: "host", urgency: "medium", position: "主机维修岗" },
          zhipu: { ok: true, tag: "network", urgency: "medium", position: "网络维修岗" },
        },
      ],
      [
        "B",
        {
          deepseek: { ok: false, error: "HTTP 500" },
          zhipu: { ok: true, tag: "display", urgency: "high", position: "显示维修岗" },
        },
      ],
    ]),
  );
  assert.equal(summary.caseCount, 2);
  assert.equal(summary.deepseek.fullHits, 1);
  assert.equal(summary.deepseek.httpFailures, 1);
  assert.equal(summary.zhipu.tagHits, 1);
  assert.equal(summary.zhipu.fullHits, 0);
  assert.equal(summary.disagreements, 1);
  assert.equal(rows[1].disagree, false);
  assert.equal(judge(sample[0], { ok: false, error: "无法解析标签字段：空" }).failureKind, "解析失败");
});
