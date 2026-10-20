import assert from "node:assert/strict";
import test from "node:test";
import { canViewTicket, dispatchBlockReason, nextTechnicianStatus } from "./policy";

test("未确认的工单不能派发", () => {
  assert.equal(
    dispatchBlockReason({ status: "submitted", confirmedTriageId: null }),
    "管理员确认分诊结果之前，不能派给维修人员",
  );
  assert.equal(
    dispatchBlockReason({ status: "triaged", confirmedTriageId: null }),
    "管理员确认分诊结果之前，不能派给维修人员",
  );
  assert.equal(dispatchBlockReason({ status: "confirmed", confirmedTriageId: "t1" }), null);
});

test("维修人员只能看到派给自己且已经派发的工单", () => {
  const tech = { id: "t-host", role: "technician" as const };
  assert.equal(
    canViewTicket(tech, { studentId: "s1", assigneeId: null, status: "confirmed" }),
    false,
  );
  assert.equal(
    canViewTicket(tech, { studentId: "s1", assigneeId: "t-host", status: "dispatched" }),
    true,
  );
  assert.equal(
    canViewTicket(tech, { studentId: "s1", assigneeId: "t-network", status: "dispatched" }),
    false,
  );
});

test("学生只能看自己的工单", () => {
  const student = { id: "s1", role: "student" as const };
  assert.equal(
    canViewTicket(student, { studentId: "s1", assigneeId: null, status: "submitted" }),
    true,
  );
  assert.equal(
    canViewTicket(student, { studentId: "s2", assigneeId: null, status: "submitted" }),
    false,
  );
});

test("维修进度只能按接单、处理、完成推进", () => {
  assert.equal(nextTechnicianStatus("dispatched", "accept"), "accepted");
  assert.equal(nextTechnicianStatus("accepted", "start"), "processing");
  assert.equal(nextTechnicianStatus("processing", "complete"), "completed");
  assert.equal(nextTechnicianStatus("dispatched", "complete"), null);
  assert.equal(nextTechnicianStatus("submitted", "accept"), null);
});
