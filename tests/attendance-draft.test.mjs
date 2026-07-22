import assert from "node:assert/strict";
import test from "node:test";
import {
  createAttendanceDraft,
  parseAttendanceDraft,
} from "../lib/attendance-draft.ts";

const workerA = "11111111-1111-4111-8111-111111111111";
const workerB = "22222222-2222-4222-8222-222222222222";
const options = {
  allowedWorkerIds: new Set([workerA, workerB]),
  allowedServiceTypes: new Set(["Sunday Service", "Tuesday Service"]),
  latestSubmissionByService: {},
};

test("attendance drafts are deterministic and remove duplicate worker ids", () => {
  assert.deepEqual(
    createAttendanceDraft("Sunday Service", [workerB, workerA, workerA], "2026-07-22T10:00:00.000Z"),
    {
      version: 1,
      serviceType: "Sunday Service",
      presentWorkerIds: [workerA, workerB],
      updatedAt: "2026-07-22T10:00:00.000Z",
    },
  );
});

test("draft recovery filters workers no longer on the active roster", () => {
  const recovered = parseAttendanceDraft(JSON.stringify({
    version: 1,
    serviceType: "Sunday Service",
    presentWorkerIds: [workerA, "removed-worker"],
    updatedAt: "2026-07-22T10:00:00.000Z",
  }), options);

  assert.deepEqual(recovered?.presentWorkerIds, [workerA]);
});

test("a server submission newer than the local draft makes the draft stale", () => {
  const recovered = parseAttendanceDraft(JSON.stringify({
    version: 1,
    serviceType: "Sunday Service",
    presentWorkerIds: [workerA],
    updatedAt: "2026-07-22T10:00:00.000Z",
  }), {
    ...options,
    latestSubmissionByService: { "Sunday Service": "2026-07-22T10:01:00.000Z" },
  });

  assert.equal(recovered, null);
});

test("correction drafts newer than the last submission remain recoverable", () => {
  const recovered = parseAttendanceDraft(JSON.stringify({
    version: 1,
    serviceType: "Sunday Service",
    presentWorkerIds: [workerB],
    updatedAt: "2026-07-22T10:02:00.000Z",
  }), {
    ...options,
    latestSubmissionByService: { "Sunday Service": "2026-07-22T10:01:00.000Z" },
  });

  assert.equal(recovered?.serviceType, "Sunday Service");
  assert.deepEqual(recovered?.presentWorkerIds, [workerB]);
});

test("malformed and empty drafts are rejected", () => {
  assert.equal(parseAttendanceDraft("not json", options), null);
  assert.equal(parseAttendanceDraft(JSON.stringify({ version: 1, serviceType: "", presentWorkerIds: [], updatedAt: "invalid" }), options), null);
});
