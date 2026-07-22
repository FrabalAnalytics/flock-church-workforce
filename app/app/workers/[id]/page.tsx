import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { EmptyState, MetricPill, PageHeader, StatusBadge } from "@/components/workspace-ui";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { summarizeWorkerAttendance } from "@/lib/worker-profile";

export const metadata = {
  title: "Worker profile",
  description: "Review a worker's directory, attendance and care history.",
};

type AttendanceRecord = {
  id: string;
  status: "Present" | "Absent";
  created_at: string;
  services: { service_date: string; service_type: string } | null;
};

type WorkerRecord = {
  id: string;
  full_name: string;
  phone_number: string | null;
  sex: "Male" | "Female" | null;
  status: "Active" | "Inactive" | "On Leave";
  joined_at: string;
  created_at: string;
  whatsapp_opt_in: boolean;
  departments: { name: string } | null;
};

type FollowupRecord = {
  id: string;
  consecutive_misses: number;
  notes: string | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  services: { service_date: string; service_type: string } | null;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatServiceDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function workerStatusTone(status: string): "success" | "warning" | "neutral" {
  if (status === "Active") return "success";
  if (status === "On Leave") return "warning";
  return "neutral";
}

export default async function WorkerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireProfile();
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();

  const supabase = await createClient();
  const [workerResult, attendanceResult, followupsResult] = await Promise.all([
    supabase
      .from("workers")
      .select("id, full_name, phone_number, sex, status, joined_at, created_at, whatsapp_opt_in, departments(name)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("attendance_logs")
      .select("id, status, created_at, services(service_date, service_type)")
      .eq("worker_id", id)
      .order("created_at", { ascending: false })
      .limit(250),
    supabase
      .from("absence_followups")
      .select("id, consecutive_misses, notes, resolved, resolved_at, created_at, services(service_date, service_type)")
      .eq("worker_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const worker = workerResult.data as unknown as WorkerRecord | null;
  if (!worker) notFound();

  const department = worker.departments as unknown as { name: string } | null;
  const attendance = (attendanceResult.data ?? []) as unknown as AttendanceRecord[];
  const followups = (followupsResult.data ?? []) as unknown as FollowupRecord[];
  const summary = summarizeWorkerAttendance(attendance);
  const openFollowups = followups.filter((followup) => !followup.resolved);
  const initials = worker.full_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const canEdit = profile.role === "super_admin";
  const backHref = canEdit ? "/app/workers" : "/app/attendance";
  const error = workerResult.error?.message ?? attendanceResult.error?.message ?? followupsResult.error?.message;

  return (
    <div className="mx-auto max-w-6xl">
      <WorkspaceNotice error={error} />
      <Link href={backHref} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-strong)]">
        <span aria-hidden="true">&larr;</span>
        {canEdit ? "Back to worker directory" : "Back to attendance"}
      </Link>

      <div className="mt-4">
        <PageHeader
          eyebrow="Worker record"
          title={worker.full_name}
          description={`${department?.name ?? "Unassigned"} Department · Joined ${formatServiceDate(worker.joined_at)}`}
          actions={canEdit ? <Link href={`/app/workers/${worker.id}/edit`} className="flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] hover:bg-[var(--color-primary-strong)]">Edit worker</Link> : undefined}
        />
      </div>

      <section className="mt-7 grid gap-5 rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6 lg:grid-cols-[auto_1fr_auto] lg:items-center" aria-label="Worker directory details">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-xl font-semibold text-[var(--color-primary-strong)]">{initials || "W"}</div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={workerStatusTone(worker.status)}>{worker.status}</StatusBadge>
            <StatusBadge>{worker.sex ?? "Sex not recorded"}</StatusBadge>
            <StatusBadge tone={worker.whatsapp_opt_in ? "success" : "neutral"}>WhatsApp care {worker.whatsapp_opt_in ? "enabled" : "off"}</StatusBadge>
          </div>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Record created {formatTimestamp(worker.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {worker.phone_number ? <a href={`tel:${worker.phone_number}`} className="inline-flex min-h-11 items-center rounded-xl bg-[var(--color-primary-soft)] px-4 text-sm font-semibold text-[var(--color-primary-strong)]">Call {worker.phone_number}</a> : <span className="text-sm text-[var(--color-text-muted)]">No phone number recorded</span>}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Worker attendance summary">
        <MetricPill value={`${summary.rate}%`} label="attendance rate" />
        <MetricPill value={summary.present} label="present" />
        <MetricPill value={summary.absent} label="absent" tone={summary.absent ? "warning" : "neutral"} />
        <MetricPill value={openFollowups.length} label="open care alerts" tone={openFollowups.length ? "danger" : "neutral"} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]" aria-labelledby="worker-attendance-title">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-5 py-4 sm:px-6">
            <h2 id="worker-attendance-title" className="text-lg font-semibold">Recent attendance</h2>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Latest individual service records, up to 250 records in the summary.</p>
          </div>
          {attendance.length ? (
            <div className="divide-y divide-[var(--color-border)]">
              {attendance.slice(0, 12).map((record) => (
                <div key={record.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{record.services?.service_type ?? "Service"}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{record.services?.service_date ? formatServiceDate(record.services.service_date) : formatTimestamp(record.created_at)}</p>
                  </div>
                  <StatusBadge tone={record.status === "Present" ? "success" : "danger"}>{record.status}</StatusBadge>
                </div>
              ))}
            </div>
          ) : <div className="p-5 sm:p-6"><EmptyState title="No attendance history" description="This worker's service records will appear after their department submits attendance." /></div>}
        </section>

        <section className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]" aria-labelledby="worker-care-title">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-5 py-4 sm:px-6">
            <h2 id="worker-care-title" className="text-lg font-semibold">Care history</h2>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Open and resolved absence follow-ups.</p>
          </div>
          {followups.length ? (
            <div className="divide-y divide-[var(--color-border)]">
              {followups.slice(0, 10).map((followup) => (
                <article key={followup.id} className="px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{followup.consecutive_misses} consecutive {followup.consecutive_misses === 1 ? "miss" : "misses"}</p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{followup.services?.service_type ?? "Service"}{followup.services?.service_date ? ` · ${formatServiceDate(followup.services.service_date)}` : ""}</p>
                    </div>
                    <StatusBadge tone={followup.resolved ? "success" : followup.consecutive_misses >= 4 ? "danger" : "warning"}>{followup.resolved ? "Resolved" : "Open"}</StatusBadge>
                  </div>
                  {followup.notes && <p className="mt-3 line-clamp-3 whitespace-pre-line text-xs leading-5 text-[var(--color-text-secondary)]">{followup.notes}</p>}
                </article>
              ))}
            </div>
          ) : <div className="p-5 sm:p-6"><EmptyState title="No care alerts" description="No absence follow-up has been recorded for this worker." /></div>}
          <div className="border-t border-[var(--color-border)] px-5 py-4 sm:px-6"><Link href="/app/follow-ups" className="text-sm font-semibold text-[var(--color-primary)]">Open care alerts</Link></div>
        </section>
      </div>
    </div>
  );
}
