import assert from "node:assert/strict";
import test from "node:test";
import { summarizeWorkerAttendance } from "../lib/worker-profile.ts";

test("worker attendance summary calculates totals and rounded rate", () => {
  assert.deepEqual(
    summarizeWorkerAttendance([
      { status: "Present" },
      { status: "Absent" },
      { status: "Present" },
    ]),
    { total: 3, present: 2, absent: 1, rate: 67 },
  );
});

test("worker attendance summary handles an empty history", () => {
  assert.deepEqual(
    summarizeWorkerAttendance([]),
    { total: 0, present: 0, absent: 0, rate: 0 },
  );
});
