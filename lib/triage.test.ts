import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTriage } from "./triage";
import { taxonomyPrompt } from "./taxonomy";

test("分诊提示词使用系统里的划分依据", () => {
  const prompt = taxonomyPrompt();
  assert.equal(prompt, taxonomyPrompt());
  assert.match(prompt, /主机维修岗/);
  assert.match(prompt, /特急/);
  assert.match(prompt, /peripheral/);
});

test("模型别名会归一成标准答案字段", () => {
  const parsed = normalizeTriage({
    tag: "计算机主机",
    urgency: "较急",
    position: "主机维修岗",
    reason: "主机无法开机",
  });
  assert.deepEqual(parsed, {
    tag: "host",
    urgency: "medium",
    position: "主机维修岗",
    reason: "主机无法开机",
  });
});

test("无法识别的岗位算解析失败", () => {
  assert.throws(() =>
    normalizeTriage({
      tag: "host",
      urgency: "low",
      position: "万能维修",
      reason: "随便",
    }),
  );
});
