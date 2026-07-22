import Link from "next/link";
import { EmptyState, MetricPill, PageHeader, StatusBadge } from "@/components/workspace-ui";
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Audit history",
  description: "Review sensitive administrative and operational record changes.",
};

const entityLabels: Record<string, string> = {
  profiles: "User access",
  departments: "Department",
  workers: "Worker",
  services: "Service",
  service_department_expectations: "Service expectation",
  attendance_submissions: "Worker attendance",
  church_attendance: "Congregation attendance",
  absence_followups: "Care follow-up",
  ministers: "Minister",
  service_programmes: "Service programme",
  service_programme_items: "Programme item",
  service_programme_shares: "Programme sharing",
};

const actions = ["inserted", "updated", "deleted"] as const;
const ignoredFields = new Set(["created_at", "updated_at"]);

type AuditRow = {
  id: string;
  entity_table: string;
  entity_id: string;
  action: (typeof actions)[number];
  actor_name: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultRange() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const toValue = `${values.year}-${values.month}-${values.day}`;
  const from = new Date(`${toValue}T00:00:00.000Z`);
  from.setUTCDate(from.getUTCDate() - 29);
  return { from: isoDate(from), to: toValue };
}

function validDate(value: string | undefined, fallback: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") ? value! : fallback;
}

function changedFields(event: AuditRow) {
  const before = event.before_data ?? {};
  const after = event.after_data ?? {};
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((key) => !ignoredFields.has(key))
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
}

function fieldLabel(value: string) {
  return value.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not set";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function displayTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; action?: string; from?: string; to?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;
  const fallback = defaultRange();
  const from = validDate(params.from, fallback.from);
  const to = validDate(params.to, fallback.to);
  const selectedEntity = params.entity && entityLabels[params.entity] ? params.entity : "";
  const selectedAction = actions.includes(params.action as (typeof actions)[number]) ? params.action! : "";
  const supabase = await createClient();
  let query = supabase
    .from("audit_events")
    .select("id, entity_table, entity_id, action, actor_name, before_data, after_data, created_at")
    .gte("created_at", `${from}T00:00:00.000+01:00`)
    .lte("created_at", `${to}T23:59:59.999+01:00`)
    .order("created_at", { ascending: false })
    .limit(250);
  if (selectedEntity) query = query.eq("entity_table", selectedEntity);
  if (selectedAction) query = query.eq("action", selectedAction);
  const { data, error } = await query;
  const events = (data ?? []) as AuditRow[];
  const updateCount = events.filter((event) => event.action === "updated").length;
  const actorCount = new Set(events.map((event) => event.actor_name)).size;
  const entityCount = new Set(events.map((event) => event.entity_table)).size;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Administration"
        title="Audit history"
        description="Review who changed sensitive records, when they changed them, and the values recorded before and after."
        actions={<Link href="/app/users" className="flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-5 text-sm font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-sm)]">User access</Link>}
      />

      <section className="mt-6 rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto_auto]">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Record type<select name="entity" defaultValue={selectedEntity} className="mt-2 h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal"><option value="">All record types</option>{Object.entries(entityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Action<select name="action" defaultValue={selectedAction} className="mt-2 h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal"><option value="">All actions</option>{actions.map((action) => <option key={action} value={action}>{fieldLabel(action)}</option>)}</select></label>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">From<input type="date" name="from" defaultValue={from} className="mt-2 h-11 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">To<input type="date" name="to" defaultValue={to} className="mt-2 h-11 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm font-normal" /></label>
          <button className="self-end min-h-11 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white">Apply</button>
          <Link href="/app/audit" className="flex min-h-11 items-center justify-center self-end rounded-xl border border-[var(--color-border)] px-5 text-sm font-semibold text-[var(--color-text-secondary)]">Clear</Link>
        </form>
      </section>

      <div className="mt-5 flex flex-wrap gap-2">
        <MetricPill label="Events shown" value={events.length} />
        <MetricPill label="Updates" value={updateCount} />
        <MetricPill label="Record types" value={entityCount} />
        <MetricPill label="Actors" value={actorCount} />
      </div>

      <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]" aria-labelledby="audit-events-title">
        <div className="border-b border-[var(--color-border)] px-5 py-4 sm:px-6"><h2 id="audit-events-title" className="font-semibold text-[var(--color-text)]">Recorded changes</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Newest first · Up to 250 events in the selected period</p></div>
        {error ? (
          <div className="p-5"><EmptyState title="Audit history unavailable" description={error.message} /></div>
        ) : events.length ? (
          <div className="divide-y divide-[var(--color-border)]">
            {events.map((event) => {
              const fields = changedFields(event);
              const tone = event.action === "deleted" ? "danger" : event.action === "inserted" ? "success" : "info";
              return (
                <article key={event.id} className="px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-[var(--color-text)]">{entityLabels[event.entity_table] ?? fieldLabel(event.entity_table)}</h3><StatusBadge tone={tone}>{fieldLabel(event.action)}</StatusBadge></div><p className="mt-1 text-xs text-[var(--color-text-muted)]">By {event.actor_name} · {displayTimestamp(event.created_at)}</p></div>
                    <code className="break-all text-[11px] text-[var(--color-text-muted)]">{event.entity_id}</code>
                  </div>
                  <details className="mt-4 rounded-2xl bg-[var(--color-surface-subtle)] px-4 py-3">
                    <summary className="cursor-pointer text-xs font-semibold text-[var(--color-primary-strong)]">Review {fields.length} changed {fields.length === 1 ? "field" : "fields"}</summary>
                    <div className="mt-3 space-y-2">
                      {fields.map((field) => (
                        <div key={field} className="grid gap-1 border-t border-[var(--color-border)] pt-2 text-xs sm:grid-cols-[150px_1fr_1fr] sm:gap-3">
                          <p className="font-semibold text-[var(--color-text-secondary)]">{fieldLabel(field)}</p>
                          <p className="break-words text-[var(--color-text-muted)]"><span className="font-medium">Before:</span> {displayValue(event.before_data?.[field])}</p>
                          <p className="break-words text-[var(--color-text)]"><span className="font-medium">After:</span> {displayValue(event.after_data?.[field])}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        ) : <div className="p-5"><EmptyState title="No audit events found" description="No recorded changes match the selected date, record type, and action filters." /></div>}
      </section>
    </div>
  );
}
