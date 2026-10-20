import assert from "node:assert/strict";
import test from "node:test";
import { CASES } from "../data/cases";
import { TAGS, positionFor } from "./taxonomy";
import type { TagId, Urgency } from "./types";

const tags = new Set<TagId>(TAGS.map((item) => item.id));
const urgencies = new Set<Urgency>(["low", "medium", "high", "critical"]);

test("模拟报修不少于 100 条，并且带标准答案", () => {
  assert.ok(CASES.length >= 100);
  const ids = new Set(CASES.map((item) => item.id));
  const descriptions = new Set(CASES.map((item) => item.description));
  assert.equal(ids.size, CASES.length);
  assert.equal(descriptions.size, CASES.length);
  for (const item of CASES) {
    assert.ok(tags.has(item.tag));
    assert.ok(urgencies.has(item.urgency));
    assert.equal(item.position, positionFor(item.tag));
    assert.ok(item.basis.length > 4);
    assert.ok(item.room.length > 0);
    assert.ok(item.device.length > 0);
    assert.ok(item.description.length >= 8);
  }
  for (const tag of tags) {
    assert.ok(CASES.filter((item) => item.tag === tag).length >= 20, tag);
  }
});
