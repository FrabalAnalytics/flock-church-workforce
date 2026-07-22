import assert from "node:assert/strict";
import test from "node:test";
import { isNotificationSnoozed, validNotificationKey } from "../lib/notification-state.ts";

test("notification keys accept scoped operational identifiers", () => {
  assert.equal(
    validNotificationKey("attendance:33333333-3333-4333-8333-333333333333:22222222-2222-4222-8222-222222222222"),
    "attendance:33333333-3333-4333-8333-333333333333:22222222-2222-4222-8222-222222222222",
  );
  assert.equal(validNotificationKey("../../admin"), null);
  assert.equal(validNotificationKey("pending:x"), null);
});

test("snoozing only applies while its timestamp is in the future", () => {
  const now = new Date("2026-07-22T12:00:00Z");
  assert.equal(isNotificationSnoozed({ notification_key: "x", read_at: null, snoozed_until: "2026-07-23T12:00:00Z" }, now), true);
  assert.equal(isNotificationSnoozed({ notification_key: "x", read_at: null, snoozed_until: "2026-07-21T12:00:00Z" }, now), false);
  assert.equal(isNotificationSnoozed(undefined, now), false);
});
