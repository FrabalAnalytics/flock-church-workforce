import assert from "node:assert/strict";
import test from "node:test";
import {
  parseCsv,
  validateWorkerImport,
} from "../lib/worker-import-validation.ts";

const departments = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Media" },
  { id: "22222222-2222-4222-8222-222222222222", name: "Ushering" },
];
const today = "2026-07-22";

test("CSV parser preserves commas and escaped quotes inside quoted values", () => {
  assert.deepEqual(
    parseCsv('full_name,department\n"Doe, Jane ""JJ""",Media'),
    [["full_name", "department"], ['Doe, Jane "JJ"', "Media"]],
  );
});

test("validator normalizes headings, values, defaults, and department case", () => {
  const [row] = validateWorkerImport(
    "\uFEFFFull Name,Department,Sex,Status,WhatsApp Opt In,Phone Number\nAda Lovelace,media,female,on_leave,yes,+2348000000000",
    departments,
    today,
  );

  assert.equal(row.errors.length, 0);
  assert.equal(row.duplicate, false);
  assert.deepEqual(row.payload, {
    full_name: "Ada Lovelace",
    phone_number: "+2348000000000",
    sex: "Female",
    department_id: departments[0].id,
    status: "On Leave",
    joined_at: today,
    whatsapp_opt_in: true,
  });
});

test("validator marks repeated name and department rows without rejecting the first", () => {
  const rows = validateWorkerImport(
    "full_name,department\nGrace Hopper,Media\ngrace hopper,media",
    departments,
    today,
  );

  assert.equal(rows[0].duplicate, false);
  assert.equal(rows[1].duplicate, true);
  assert.ok(rows[1].payload);
});

test("validator rejects unsafe consent, future dates, and unknown departments", () => {
  const [row] = validateWorkerImport(
    "full_name,department,joined_at,whatsapp_opt_in\nA,Unknown,2026-07-23,yes",
    departments,
    today,
  );

  assert.equal(row.payload, null);
  assert.ok(row.errors.some((error) => error.includes("Full name")));
  assert.ok(row.errors.some((error) => error.includes("does not match")));
  assert.ok(row.errors.some((error) => error.includes("not in the future")));
  assert.ok(row.errors.some((error) => error.includes("phone number")));
});

test("validator rejects malformed headers and quoted values", () => {
  assert.throws(
    () => validateWorkerImport("full_name\nAda", departments, today),
    /Missing required column: department/,
  );
  assert.throws(
    () => validateWorkerImport('full_name,department\n"Ada,Media', departments, today),
    /unclosed quoted value/,
  );
});

test("validator enforces the 500-row batch limit", () => {
  const csv = ["full_name,department", ...Array.from({ length: 501 }, (_, index) => `Person ${index},Media`)].join("\n");
  assert.throws(() => validateWorkerImport(csv, departments, today), /no more than 500 workers/);
});
