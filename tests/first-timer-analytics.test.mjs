import assert from "node:assert/strict";
import test from "node:test";
import { buildFirstTimerMovementAnalytics, validateFirstTimerReportFilters } from "../lib/first-timer-analytics.ts";

const people = [
  { id: "one", fullName: "Ada Visitor", firstVisitDate: "2026-01-01", journeyStage: "member", trainingStatus: "completed", trainingStartedAt: "2026-01-12", trainingCompletedAt: "2026-01-20", assignedTo: "lead", nextFollowupAt: null, createdAt: "2026-01-01T10:00:00Z", visits: [{ visitDate: "2026-01-01" }, { visitDate: "2026-01-08" }] },
  { id: "two", fullName: "Ben Visitor", firstVisitDate: "2026-01-05", journeyStage: "follow_up", trainingStatus: "not_started", trainingStartedAt: null, trainingCompletedAt: null, assignedTo: null, nextFollowupAt: "2026-01-15T10:00:00Z", createdAt: "2026-01-05T10:00:00Z", visits: [{ visitDate: "2026-01-05" }] },
];

test("first-timer movement analytics calculate conversion and timing", () => {
  const result = buildFirstTimerMovementAnalytics({
    people,
    transitions: [
      { firstTimerId: "one", fromStage: null, toStage: "new", changedAt: "2026-01-01T10:00:00Z" },
      { firstTimerId: "one", fromStage: "membership_training", toStage: "member", changedAt: "2026-01-22T10:00:00Z" },
      { firstTimerId: "two", fromStage: null, toStage: "new", changedAt: "2026-01-05T10:00:00Z" },
    ],
    coordinators: [{ id: "lead", name: "Lead Coordinator" }],
    from: "2026-01-01",
    to: "2026-01-31",
    now: new Date("2026-02-20T10:00:00Z"),
  });
  assert.equal(result.total, 2);
  assert.equal(result.returnRate, 50);
  assert.equal(result.memberConversionRate, 50);
  assert.equal(result.averageDaysToReturn, 7);
  assert.equal(result.averageDaysToMembership, 21);
  assert.equal(result.stalled.some((person) => person.id === "two"), true);
});

test("first-timer report filters enforce range and coordinator format", () => {
  assert.deepEqual(validateFirstTimerReportFilters({ from: "2026-01-01", to: "2026-02-01", coordinator: "unassigned" }), { from: "2026-01-01", to: "2026-02-01", coordinator: "unassigned" });
  assert.match(validateFirstTimerReportFilters({ from: "2026-02-01", to: "2026-01-01" }), /between 1 and 730 days/);
  assert.match(validateFirstTimerReportFilters({ from: "2026-01-01", to: "2026-02-01", coordinator: "bad" }), /valid coordinator/);
});
