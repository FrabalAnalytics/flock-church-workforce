import assert from "node:assert/strict";
import test from "node:test";
import { validateInvitationInput } from "../lib/user-invitation.ts";

const departmentId = "11111111-1111-4111-8111-111111111111";

test("invitation validation normalizes accepted account details", () => {
  const result = validateInvitationInput({
    fullName: "  Ada Lovelace  ",
    email: " ADA@EXAMPLE.COM ",
    phoneNumber: " +2348000000000 ",
    role: "department_head",
    departmentId,
  });

  assert.equal(result.error, null);
  assert.deepEqual(result.value, {
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phoneNumber: "+2348000000000",
    role: "department_head",
    departmentId,
  });
});

test("non-department roles cannot retain a department assignment", () => {
  const result = validateInvitationInput({
    fullName: "Grace Hopper",
    email: "grace@example.com",
    phoneNumber: "",
    role: "church_leader",
    departmentId,
  });

  assert.equal(result.value?.departmentId, null);
});

test("department heads require a valid department", () => {
  const result = validateInvitationInput({
    fullName: "Grace Hopper",
    email: "grace@example.com",
    phoneNumber: "",
    role: "department_head",
    departmentId: "",
  });

  assert.match(result.error ?? "", /must be assigned/);
});

test("unknown roles and malformed contact details are rejected", () => {
  assert.match(validateInvitationInput({ fullName: "A", email: "bad", phoneNumber: "", role: "owner", departmentId: "" }).error ?? "", /full name/);
  assert.match(validateInvitationInput({ fullName: "Valid Name", email: "bad", phoneNumber: "", role: "church_leader", departmentId: "" }).error ?? "", /valid email/);
  assert.match(validateInvitationInput({ fullName: "Valid Name", email: "valid@example.com", phoneNumber: "", role: "owner", departmentId: "" }).error ?? "", /valid invited-user role/);
});
