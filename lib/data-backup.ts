export const BACKUP_FORMAT_VERSION = 1;

export const BACKUP_TABLES = [
  "church_settings",
  "departments",
  "profiles",
  "workers",
  "services",
  "attendance_submissions",
  "attendance_logs",
  "service_department_expectations",
  "service_control_events",
  "church_attendance",
  "ministers",
  "service_programme_templates",
  "service_programme_template_items",
  "service_programmes",
  "service_programme_items",
  "service_programme_shares",
  "first_timers",
  "first_timer_interactions",
  "first_timer_visits",
  "absence_followups",
  "followup_events",
  "audit_events",
  "system_job_runs",
] as const;

export function backupFilename(churchName: string, date: Date) {
  const safeName = churchName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "flock-church";
  const datePart = date.toISOString().slice(0, 10);
  return `${safeName}-flock-backup-${datePart}.json`;
}
