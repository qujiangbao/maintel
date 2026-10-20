import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import test from "node:test";
import type { ModelRun } from "./triage";

test("从提交到完成会留下两次分诊，未确认不能派发", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "lab-repair-"));
  process.env.STORE_PATH = path.join(dir, "store.json");
  try {
  const { USERS, toPublicUser } = await import("./users");
  const tickets = await import("./tickets");
  const student = toPublicUser(USERS.find((item) => item.id === "s1")!);
  const other = toPublicUser(USERS.find((item) => item.id === "s2")!);
  const admin = toPublicUser(USERS.find((item) => item.id === "a1")!);
  const hostTech = toPublicUser(USERS.find((item) => item.id === "t-host")!);
  const otherTech = toPublicUser(USERS.find((item) => item.id === "t-peripheral")!);

  const created = await tickets.submitTicket(student, {
    room: "第二机房 A203",
    device: "工位18主机",
    description: "按下电源键完全没反应，机箱灯不亮。",
  });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const id = created.data.id;

  assert.equal((await tickets.getTicket(other, id)).ok, false);
  assert.equal((await tickets.getTicket(hostTech, id)).ok, false);
  assert.equal((await tickets.listTickets(hostTech)).length, 0);

  const blocked = await tickets.dispatchTicket(admin, id, hostTech.id);
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.match(blocked.error, /确认/);

  const failed = await tickets.recordTriage(admin, id, run("deepseek", false));
  assert.equal(failed.ok, true);
  if (!failed.ok) return;
  assert.equal(failed.data.status, "submitted");

  const first = await tickets.recordTriage(
    admin,
    id,
    run("deepseek", true, "medium"),
  );
  const second = await tickets.recordTriage(admin, id, run("zhipu", true, "high"));
  assert.equal(first.ok && second.ok, true);
  if (!second.ok) return;
  assert.equal(second.data.triages.length, 3);
  assert.equal(second.data.status, "triaged");

  const confirmed = await tickets.confirmTriage(admin, id, second.data.triages[1].id);
  assert.equal(confirmed.ok, true);
  if (!confirmed.ok) return;
  assert.equal(confirmed.data.status, "confirmed");

  const wrong = await tickets.dispatchTicket(admin, id, otherTech.id);
  assert.equal(wrong.ok, false);

  const dispatched = await tickets.dispatchTicket(admin, id, hostTech.id);
  assert.equal(dispatched.ok, true);
  if (!dispatched.ok) return;
  assert.equal((await tickets.listTickets(otherTech)).length, 0);
  assert.equal((await tickets.listTickets(hostTech)).length, 1);

  assert.equal((await tickets.transitionTicket(hostTech, id, "accept")).ok, true);
  assert.equal((await tickets.transitionTicket(hostTech, id, "start")).ok, true);
  const done = await tickets.transitionTicket(hostTech, id, "complete", "更换电源后恢复");
  assert.equal(done.ok, true);
  if (!done.ok) return;
  assert.equal(done.data.status, "completed");
  assert.deepEqual(
    done.data.history.map((item) => item.action),
    ["提交报修", "分诊", "重新分诊", "重新分诊", "确认分诊", "派发", "接单", "开始处理", "完成"],
  );

  const studentView = await tickets.getTicket(student, id);
  assert.equal(studentView.ok, true);
  if (!studentView.ok) return;
  assert.equal(studentView.data.triages.length, 1);
  assert.equal(studentView.data.triages[0].model, "deepseek");
  } finally {
    rmSync(dir, { recursive: true, force: true });
    delete process.env.STORE_PATH;
  }
});

function run(model: "deepseek" | "zhipu", ok: boolean, urgency: "medium" | "high" = "medium"): ModelRun {
  if (!ok) {
    return {
      ok: false,
      model,
      modelName: model,
      error: "HTTP 500",
      raw: "",
      latencyMs: 10,
      httpStatus: 500,
    };
  }
  return {
    ok: true,
    model,
    modelName: model === "deepseek" ? "deepseek-flash" : "glm-4-flash-250414",
    tag: "host",
    urgency,
    position: "主机维修岗",
    reason: "主机无法开机",
    raw: "{}",
    latencyMs: 20,
    httpStatus: 200,
  };
}
