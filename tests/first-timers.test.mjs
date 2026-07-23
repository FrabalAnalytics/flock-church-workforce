import assert from "node:assert/strict";
import test from "node:test";
import { normalizePhoneNumber, validateFirstTimerRegistration, validateMembershipTrainingUpdate } from "../lib/first-timers.ts";

test("first-timer registration normalizes contact details", () => {
  const result = validateFirstTimerRegistration({
    fullName: "  Grace Visitor ",
    phoneNumber: " +234 803 000 0000 ",
    email: " GRACE@EXAMPLE.COM ",
    preferredContact: "whatsapp",
    consentToContact: true,
    firstVisitDate: "2026-07-22",
    firstServiceType: "Sunday Service",
  });
  assert.equal(typeof result, "object");
  assert.equal(result.fullName, "Grace Visitor");
  assert.equal(result.phoneNumberNormalized, "2348030000000");
  assert.equal(result.email, "grace@example.com");
});

test("registration without consent disables follow-up contact", () => {
  const result = validateFirstTimerRegistration({
    fullName: "Grace Visitor",
    phoneNumber: "08030000000",
    email: "",
    preferredContact: "whatsapp",
    consentToContact: false,
    firstVisitDate: "2026-07-22",
    firstServiceType: "Tuesday Service",
  });
  assert.equal(typeof result, "object");
  assert.equal(result.preferredContact, "none");
});

test("malformed phone numbers and unsupported services are rejected", () => {
  assert.equal(normalizePhoneNumber("+234 (803) 000-0000"), "2348030000000");
  const base = { fullName: "Grace Visitor", phoneNumber: "12", email: "", preferredContact: "phone", consentToContact: true, firstVisitDate: "2026-07-22", firstServiceType: "Sunday Service" };
  assert.match(validateFirstTimerRegistration(base), /valid phone/);
  assert.match(validateFirstTimerRegistration({ ...base, phoneNumber: "08030000000", firstServiceType: "Weekend" }), /service type/);
});

test("membership training completion requires a valid date range", () => {
  const result = validateMembershipTrainingUpdate({
    status: "completed",
    startedAt: "2026-07-01",
    completedAt: "2026-07-20",
    notes: "Completed the new members class.",
  });
  assert.equal(typeof result, "object");
  assert.equal(result.status, "completed");
  assert.equal(result.completedAt, "2026-07-20");
});

test("membership training cannot be completed without both dates", () => {
  assert.match(validateMembershipTrainingUpdate({ status: "completed", startedAt: "2026-07-01", completedAt: "", notes: "" }), /both the training start and completion dates/);
  assert.match(validateMembershipTrainingUpdate({ status: "completed", startedAt: "2026-07-20", completedAt: "2026-07-01", notes: "" }), /cannot be earlier/);
});
