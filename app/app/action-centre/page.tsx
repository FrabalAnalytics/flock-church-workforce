import Link from "next/link";
import { EmptyState, MetricPill, PageHeader, StatusBadge } from "@/components/workspace-ui";
import { findMissingAttendanceActions, type ServiceActionSnapshot } from "@/lib/action-centre";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Action Centre",
  description: "Review the operational items that currently need attention.",
};

type ServiceRow = {
  id: string;
  service_type: string;
  service_date: string;
  attendance_status: "open" | "closed";
  service_department_expectations: Array<{
    department_id: string;
    last_reminded_at: string | null;
    departments: { name: string } | null;
  }>;
  attendance_submissions: Array<{ department_id: string }>;
};

type FollowupRow = {
  id: string;
  consecutive_misses: number;
  created_at: string;
  workers: { full_name: string; departments: { name: string } | null } | null;
};

type FailedEventRow = {
  id: string;
  event_type: string;
  error_message: string | null;
  created_at: string;
  workers: { full_name: string; departments: { name: string } | null } | null;
};

function lagosDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function daysBefore(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default async function ActionCentrePage() {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const today = lagosDate();
  const serviceLookback = daysBefore(today, 14);
  const isLeadership = profile.role === "super_admin" || profile.role === "church_leader";

  const [servicesResult, followupsResult, failedEventsResult, pendingUsersResult] = await Promise.all([
    supabase
      .from("services")
      .select(`
        id,
        service_type,
        service_date,
        attendance_status,
        service_department_expectations(department_id, last_reminded_at, departments(name)),
        attendance_submissions(department_id)
      `)
      .eq("attendance_managed", true)
      .gte("service_date", serviceLookback)
      .lte("service_date", today)
      .order("service_date", { ascending: false })
      .limit(30),
    supabase
      .from("absence_followups")
      .select("id, consecutive_misses, created_at, workers(full_name, departments(name))", { count: "exact" })
      .eq("resolved", false)
      .order("consecutive_misses", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(12),
    profile.role === "super_admin"
      ? supabase
          .from("followup_events")
          .select("id, event_type, error_message, created_at, workers(full_name, departments(name))", { count: "exact" })
          .eq("delivery_status", "failed")
          .order("created_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [], error: null, count: 0 }),
    profile.role === "super_admin"
      ? supabase
          .from("profiles")
          .select("id, full_name, email, created_at", { count: "exact" })
          .eq("role", "pending")
          .order("created_at", { ascending: true })
          .limit(10)
      : Promise.resolve({ data: [], error: null, count: 0 }),
  ]);

  const serviceSnapshots = ((servicesResult.data ?? []) as unknown as ServiceRow[]).map((service): ServiceActionSnapshot => ({
    id: service.id,
    service_type: service.service_type,
    service_date: service.service_date,
    attendance_status: service.attendance_status,
    expectations: (service.service_department_expectations ?? []).map((expectation) => ({
      department_id: expectation.department_id,
      department_name: expectation.departments?.name ?? "Unknown department",
      last_reminded_at: expectation.last_reminded_at,
    })),
    submitted_department_ids: (service.attendance_submissions ?? []).map((submission) => submission.department_id),
  }));
  const missingAttendance = findMissingAttendanceActions(
    serviceSnapshots,
    profile.role === "department_head" ? profile.department_id : null,
  ).filter((action) => isLeadership || action.attendance_status === "open");
  const followups = (followupsResult.data ?? []) as unknown as FollowupRow[];
  const urgentFollowups = followups.filter((followup) => followup.consecutive_misses >= 4);
  const failedEvents = (failedEventsResult.data ?? []) as unknown as FailedEventRow[];
  const pendingUsers = pendingUsersResult.data ?? [];
  const followupCount = followupsResult.count ?? followups.length;
  const failedEventCount = failedEventsResult.count ?? failedEvents.length;
  const pendingUserCount = pendingUsersResult.count ?? pendingUsers.length;
  const totalActions = missingAttendance.length + followupCount + failedEventCount + pendingUserCount;
  const errors = [servicesResult.error, followupsResult.error, failedEventsResult.error, pendingUsersResult.error].filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Operational priorities"
        title="Action Centre"
        description="A live, role-aware list of attendance, access, care and delivery items that need attention. Items disappear when the underlying work is completed."
        actions={<MetricPill value={totalActions} label={totalActions === 1 ? "open action" : "open actions"} tone={totalActions ? "warning" : "neutral"} />}
      />

      {errors.length > 0 && <div role="alert" className="mt-6 rounded-2xl bg-[var(--color-danger-soft)] px-5 py-4 text-sm text-[var(--color-danger)]">Some action data could not be loaded: {errors[0]?.message}</div>}

      <div className="mt-7 flex flex-wrap gap-2" aria-label="Action summary">
        <MetricPill value={missingAttendance.length} label="attendance gaps" tone={missingAttendance.length ? "warning" : "neutral"} />
        <MetricPill value={followupCount} label="care follow-ups" tone={urgentFollowups.length ? "danger" : followupCount ? "warning" : "neutral"} />
        {profile.role === "super_admin" && <MetricPill value={pendingUserCount} label="pending users" tone={pendingUserCount ? "warning" : "neutral"} />}
        {profile.role === "super_admin" && <MetricPill value={failedEventCount} label="failed messages" tone={failedEventCount ? "danger" : "neutral"} />}
      </div>

      {totalActions === 0 ? (
        <div className="mt-8"><EmptyState title="Everything is up to date" description="There are no attendance gaps, unresolved care items, access approvals or delivery failures in your current scope." /></div>
      ) : (
        <div className="mt-8 grid gap-7 xl:grid-cols-2">
          {missingAttendance.length > 0 && <section className="overflow-hidden rounded-3xl border border-[#efd8a8] bg-white shadow-[var(--shadow-sm)]">
            <div className="border-b border-[#f1e4c8] bg-[#fffaf0] px-5 py-4 sm:px-6"><h2 className="font-semibold text-[#664d1d]">Attendance gaps</h2><p className="mt-1 text-xs text-[#8a744b]">Expected departments that have not submitted for a managed service.</p></div>
            <div className="divide-y divide-[var(--color-border)]">
              {missingAttendance.map((action) => {
                const closed = action.attendance_status === "closed";
                const href = profile.role === "department_head" ? "/app/attendance/new" : `/app/service-days?date=${action.service_date}`;
                return <article key={action.key} className="p-5 sm:px-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[var(--color-text)]">{action.department_name} · {action.service_type}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">{formatDate(action.service_date)}{action.last_reminded_at ? " · reminder already recorded" : " · no reminder recorded"}</p></div><StatusBadge tone={closed ? "danger" : "warning"}>{closed ? "Overdue" : "Open"}</StatusBadge></div><Link href={href} className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-[var(--color-primary-soft)] px-4 text-xs font-semibold text-[var(--color-primary-strong)]">{profile.role === "department_head" ? "Complete attendance" : "Open service control"}</Link></article>;
              })}
            </div>
          </section>}

          {followups.length > 0 && <section className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
            <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-5 py-4 sm:px-6"><h2 className="font-semibold text-[var(--color-text)]">Care follow-ups</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Workers with unresolved consecutive absence patterns.</p></div>
            <div className="divide-y divide-[var(--color-border)]">
              {followups.map((followup) => <article key={followup.id} className="flex items-center justify-between gap-4 p-5 sm:px-6"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--color-text)]">{followup.workers?.full_name ?? "Unknown worker"}</p><p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{followup.workers?.departments?.name ?? "Department"}</p></div><div className="flex shrink-0 items-center gap-3"><StatusBadge tone={followup.consecutive_misses >= 4 ? "danger" : "warning"}>{followup.consecutive_misses} misses</StatusBadge><Link href="/app/follow-ups" aria-label={`Review follow-up for ${followup.workers?.full_name ?? "worker"}`} className="text-xs font-semibold text-[var(--color-primary)]">Review</Link></div></article>)}
            </div>
          </section>}

          {profile.role === "super_admin" && pendingUsers.length > 0 && <section className="overflow-hidden rounded-3xl border border-[#d9e3fb] bg-white shadow-[var(--shadow-sm)]">
            <div className="border-b border-[#d9e3fb] bg-[#f4f7ff] px-5 py-4 sm:px-6"><h2 className="font-semibold text-[#304d91]">Access approvals</h2><p className="mt-1 text-xs text-[#687ba4]">New accounts waiting for a role and department decision.</p></div>
            <div className="divide-y divide-[var(--color-border)]">{pendingUsers.map((user) => <article key={user.id} className="flex items-center justify-between gap-4 p-5 sm:px-6"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--color-text)]">{user.full_name}</p><p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{user.email ?? "Email unavailable"}</p></div><Link href="/app/users?role=pending" className="shrink-0 text-xs font-semibold text-[var(--color-primary)]">Review access</Link></article>)}</div>
          </section>}

          {profile.role === "super_admin" && failedEvents.length > 0 && <section className="overflow-hidden rounded-3xl border border-[#f0d7d4] bg-white shadow-[var(--shadow-sm)]">
            <div className="border-b border-[#f0d7d4] bg-[#fff9f8] px-5 py-4 sm:px-6"><h2 className="font-semibold text-[#94433d]">Message delivery failures</h2><p className="mt-1 text-xs text-[#8b6865]">Automated care messages that require configuration or contact review.</p></div>
            <div className="divide-y divide-[var(--color-border)]">{failedEvents.map((event) => <article key={event.id} className="p-5 sm:px-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--color-text)]">{event.workers?.full_name ?? "Unknown worker"}</p><p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{event.workers?.departments?.name ?? "Department"} · {event.event_type.replaceAll("_", " ")}</p></div><StatusBadge tone="danger">Failed</StatusBadge></div>{event.error_message && <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#8b6865]">{event.error_message}</p>}<Link href="/app/follow-ups" className="mt-3 inline-flex text-xs font-semibold text-[var(--color-primary)]">Inspect delivery</Link></article>)}</div>
          </section>}
        </div>
      )}
    </div>
  );
}
