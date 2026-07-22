import assert from "node:assert/strict";
import test from "node:test";
import { findMissingAttendanceActions } from "../lib/action-centre.ts";

const media = "11111111-1111-4111-8111-111111111111";
const ushering = "22222222-2222-4222-8222-222222222222";
const service = {
  id: "33333333-3333-4333-8333-333333333333",
  service_type: "Sunday Service",
  service_date: "2026-07-26",
  attendance_status: "open",
  expectations: [
    { department_id: media, department_name: "Media", last_reminded_at: null },
    { department_id: ushering, department_name: "Ushering", last_reminded_at: "2026-07-26T10:00:00Z" },
  ],
  submitted_department_ids: [media],
};

test("action centre returns only expectations without a submission", () => {
  const actions = findMissingAttendanceActions([service]);
  assert.equal(actions.length, 1);
  assert.equal(actions[0].department_id, ushering);
  assert.equal(actions[0].last_reminded_at, "2026-07-26T10:00:00Z");
});

test("department heads only receive actions for their own department", () => {
  assert.deepEqual(findMissingAttendanceActions([service], media), []);
  assert.equal(findMissingAttendanceActions([service], ushering).length, 1);
});

test("services without expectations do not create false alerts", () => {
  assert.deepEqual(findMissingAttendanceActions([{ ...service, expectations: [] }]), []);
});
