import assert from "node:assert/strict";
import test from "node:test";
import { buildOnboardingSteps, onboardingProgress } from "../lib/onboarding.ts";

test("onboarding identifies incomplete church setup", () => {
  const steps = buildOnboardingSteps({
    churchProfileReady: false,
    departmentCount: 8,
    superAdminCount: 1,
    activeWorkerCount: 0,
    attendanceSubmissionCount: 0,
  });
  const progress = onboardingProgress(steps);

  assert.equal(progress.completed, 1);
  assert.equal(progress.percentage, 20);
  assert.equal(steps.find((step) => step.key === "administrators")?.complete, false);
  assert.equal(steps.find((step) => step.key === "workers")?.href, "/app/workers/import");
});

test("onboarding reaches completion from existing operational records", () => {
  const steps = buildOnboardingSteps({
    churchProfileReady: true,
    departmentCount: 4,
    superAdminCount: 2,
    activeWorkerCount: 80,
    attendanceSubmissionCount: 3,
  });

  assert.deepEqual(onboardingProgress(steps), { completed: 5, total: 5, percentage: 100 });
  assert.equal(steps.every((step) => step.complete), true);
});
