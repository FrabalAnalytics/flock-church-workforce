import assert from "node:assert/strict";
import test from "node:test";
import { BACKUP_TABLES, backupFilename } from "../lib/data-backup.ts";

test("backup filename is safe and dated", () => {
  assert.equal(
    backupFilename(" TREM / New Covenant! ", new Date("2026-07-22T10:00:00Z")),
    "trem-new-covenant-flock-backup-2026-07-22.json",
  );
});

test("backup manifest includes identity, people, attendance, care, and audit data", () => {
  for (const table of ["church_settings", "profiles", "workers", "attendance_logs", "followup_events", "audit_events"]) {
    assert.equal(BACKUP_TABLES.includes(table), true);
  }
});
