import Link from "next/link";
import { NotificationControls } from "@/components/notification-controls";
import { EmptyState, MetricPill, PageHeader, StatusBadge } from "@/components/workspace-ui";
import { findMissingAttendanceActions, type ServiceActionSnapshot } from "@/lib/action-centre";
import { requireProfile } from "@/lib/auth";
import { isNotificationSnoozed, type NotificationState } from "@/lib/notification-state";
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

type FirstTimerActionRow = {
  id: string;
  full_name: string;
  journey_stage: string;
  assigned_to: string | null;
  next_followup_at: string | null;
  first_visit_date: string;
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
  const managesFirstTimers = isLeadership || profile.role === "first_timer_coordinator";

  const [servicesResult, followupsResult, failedEventsResult, pendingUsersResult, notificationStatesResult, firstTimersResult] = await Promise.all([
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
    supabase
      .from("notification_states")
      .select("notification_key, read_at, snoozed_until")
      .eq("user_id", profile.id),
    managesFirstTimers
      ? supabase
          .from("first_timers")
          .select("id, full_name, journey_stage, assigned_to, next_followup_at, first_visit_date")
          .not("journey_stage", "in", "(member,closed)")
          .order("created_at", { ascending: true })
          .limit(100)
      : Promise.resolve({ data: [], error: null }),
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
  const missingAttendanceAll = findMissingAttendanceActions(
    serviceSnapshots,
    profile.role === "department_head" ? profile.department_id : null,
  ).filter((action) => isLeadership || action.attendance_status === "open");
  const followupsAll = (followupsResult.data ?? []) as unknown as FollowupRow[];
  const failedEventsAll = (failedEventsResult.data ?? []) as unknown as FailedEventRow[];
  const pendingUsersAll = pendingUsersResult.data ?? [];
  const firstTimersAll = (firstTimersResult.data ?? []) as FirstTimerActionRow[];
  const notificationStates = (notificationStatesResult.data ?? []) as NotificationState[];
  const stateMap = new Map(notificationStates.map((state) => [state.notification_key, state]));
  const now = new Date();
  const attendanceKey = (key: string) => `attendance:${key}`;
  const followupKey = (id: string) => `followup:${id}`;
  const failedEventKey = (id: string) => `failed:${id}`;
  const pendingUserKey = (id: string) => `pending:${id}`;
  const firstTimerKey = (id: string) => `first-timer:${id}`;
  const snoozed = (key: string) => isNotificationSnoozed(stateMap.get(key), now);
  const read = (key: string) => Boolean(stateMap.get(key)?.read_at);
  const missingAttendance = missingAttendanceAll.filter((action) => !snoozed(attendanceKey(action.key)));
  const followups = followupsAll.filter((followup) => !snoozed(followupKey(followup.id)));
  const failedEvents = failedEventsAll.filter((event) => !snoozed(failedEventKey(event.id)));
  const pendingUsers = pendingUsersAll.filter((user) => !snoozed(pendingUserKey(user.id)));
  const firstTimersNeedingActionAll = firstTimersAll.filter((person) => !person.assigned_to || (person.next_followup_at && new Date(person.next_followup_at) <= now));
  const firstTimersNeedingAction = firstTimersNeedingActionAll.filter((person) => !snoozed(firstTimerKey(person.id)));
  const urgentFollowups = followups.filter((followup) => followup.consecutive_misses >= 4);
  const followupCount = followups.length;
  const failedEventCount = failedEvents.length;
  const pendingUserCount = pendingUsers.length;
  const totalActions = missingAttendance.length + followupCount + failedEventCount + pendingUserCount + firstTimersNeedingAction.length;
  const notificationSummaries = new Map<string, { title: string; detail: string }>([
    ...missingAttendanceAll.map((action) => [attendanceKey(action.key), { title: `${action.department_name} attendance`, detail: `${action.service_type} · ${formatDate(action.service_date)}` }] as const),
    ...followupsAll.map((followup) => [followupKey(followup.id), { title: followup.workers?.full_name ?? "Care follow-up", detail: `${followup.consecutive_misses} consecutive misses` }] as const),
    ...failedEventsAll.map((event) => [failedEventKey(event.id), { title: event.workers?.full_name ?? "Message delivery", detail: "Failed WhatsApp delivery" }] as const),
    ...pendingUsersAll.map((user) => [pendingUserKey(user.id), { title: user.full_name, detail: "Pending access approval" }] as const),
    ...firstTimersNeedingActionAll.map((person) => [firstTimerKey(person.id), { title: person.full_name, detail: person.assigned_to ? "First-timer follow-up due" : "First timer needs assignment" }] as const),
  ]);
  const snoozedNotifications = [...notificationSummaries.entries()]
    .filter(([key]) => snoozed(key))
    .map(([key, summary]) => ({ key, ...summary, until: stateMap.get(key)?.snoozed_until ?? null }));
  const errors = [servicesResult.error, followupsResult.error, failedEventsResult.error, pendingUsersResult.error, notificationStatesResult.error, firstTimersResult.error].filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Operational priorities"
        title="Action Centre"
        description="A live, role-aware notification list for attendance, access, care, and delivery. Mark items seen or snooze them without changing the underlying ministry record."
        actions={<MetricPill value={totalActions} label={totalActions === 1 ? "open action" : "open actions"} tone={totalActions ? "warning" : "neutral"} />}
      />

      {errors.length > 0 && <div role="alert" className="mt-6 rounded-2xl bg-[var(--color-danger-soft)] px-5 py-4 text-sm text-[var(--color-danger)]">Some action data could not be loaded: {errors[0]?.message}</div>}

      <div className="mt-7 flex flex-wrap gap-2" aria-label="Action summary">
        <MetricPill value={missingAttendance.length} label="attendance gaps" tone={missingAttendance.length ? "warning" : "neutral"} />
        <MetricPill value={followupCount} label="care follow-ups" tone={urgentFollowups.length ? "danger" : followupCount ? "warning" : "neutral"} />
        {managesFirstTimers && <MetricPill value={firstTimersNeedingAction.length} label="first-timer actions" tone={firstTimersNeedingAction.length ? "warning" : "neutral"} />}
        {profile.role === "super_admin" && <MetricPill value={pendingUserCount} label="pending users" tone={pendingUserCount ? "warning" : "neutral"} />}
        {profile.role === "super_admin" && <MetricPill value={failedEventCount} label="failed messages" tone={failedEventCount ? "danger" : "neutral"} />}
        <MetricPill value={snoozedNotifications.length} label="snoozed" />
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
                const key = attendanceKey(action.key);
                return <article key={action.key} className="p-5 sm:px-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[var(--color-text)]">{action.department_name} · {action.service_type}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">{formatDate(action.service_date)}{action.last_reminded_at ? " · reminder already recorded" : " · no reminder recorded"}</p></div><StatusBadge tone={closed ? "danger" : "warning"}>{closed ? "Overdue" : "Open"}</StatusBadge></div><div className="mt-4 flex flex-wrap items-center gap-3"><Link href={href} className="inline-flex min-h-10 items-center rounded-xl bg-[var(--color-primary-soft)] px-4 text-xs font-semibold text-[var(--color-primary-strong)]">{profile.role === "department_head" ? "Complete attendance" : "Open service control"}</Link><NotificationControls notificationKey={key} read={read(key)} /></div></article>;
              })}
            </div>
          </section>}

          {followups.length > 0 && <section className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
            <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-5 py-4 sm:px-6"><h2 className="font-semibold text-[var(--color-text)]">Care follow-ups</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Workers with unresolved consecutive absence patterns.</p></div>
            <div className="divide-y divide-[var(--color-border)]">
              {followups.map((followup) => {
                const key = followupKey(followup.id);
                return <article key={followup.id} className="p-5 sm:px-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--color-text)]">{followup.workers?.full_name ?? "Unknown worker"}</p><p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{followup.workers?.departments?.name ?? "Department"}</p></div><StatusBadge tone={followup.consecutive_misses >= 4 ? "danger" : "warning"}>{followup.consecutive_misses} misses</StatusBadge></div><div className="mt-4 flex flex-wrap items-center gap-3"><Link href="/app/follow-ups" aria-label={`Review follow-up for ${followup.workers?.full_name ?? "worker"}`} className="text-xs font-semibold text-[var(--color-primary)]">Review follow-up</Link><NotificationControls notificationKey={key} read={read(key)} /></div></article>;
              })}
            </div>
          </section>}

          {firstTimersNeedingAction.length > 0 && <section className="overflow-hidden rounded-3xl border border-[#d9e3fb] bg-white shadow-[var(--shadow-sm)]">
            <div className="border-b border-[#d9e3fb] bg-[#f4f7ff] px-5 py-4 sm:px-6"><h2 className="font-semibold text-[#304d91]">First-timer care</h2><p className="mt-1 text-xs text-[#687ba4]">Newcomers awaiting assignment or a scheduled coordinator follow-up.</p></div>
            <div className="divide-y divide-[var(--color-border)]">{firstTimersNeedingAction.map((person) => { const key = firstTimerKey(person.id); const unassigned = !person.assigned_to; return <article key={person.id} className="p-5 sm:px-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--color-text)]">{person.full_name}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">First visited {formatDate(person.first_visit_date)}{person.next_followup_at ? ` · follow-up ${new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(person.next_followup_at))}` : ""}</p></div><StatusBadge tone={unassigned ? "warning" : "danger"}>{unassigned ? "Unassigned" : "Due"}</StatusBadge></div><div className="mt-4 flex flex-wrap items-center gap-3"><Link href={`/app/first-timers/${person.id}`} className="text-xs font-semibold text-[var(--color-primary)]">Open journey</Link><NotificationControls notificationKey={key} read={read(key)} /></div></article>; })}</div>
          </section>}

          {profile.role === "super_admin" && pendingUsers.length > 0 && <section className="overflow-hidden rounded-3xl border border-[#d9e3fb] bg-white shadow-[var(--shadow-sm)]">
            <div className="border-b border-[#d9e3fb] bg-[#f4f7ff] px-5 py-4 sm:px-6"><h2 className="font-semibold text-[#304d91]">Access approvals</h2><p className="mt-1 text-xs text-[#687ba4]">New accounts waiting for a role and department decision.</p></div>
            <div className="divide-y divide-[var(--color-border)]">{pendingUsers.map((user) => { const key = pendingUserKey(user.id); return <article key={user.id} className="p-5 sm:px-6"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--color-text)]">{user.full_name}</p><p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{user.email ?? "Email unavailable"}</p></div><div className="mt-4 flex flex-wrap items-center gap-3"><Link href="/app/users?role=pending" className="text-xs font-semibold text-[var(--color-primary)]">Review access</Link><NotificationControls notificationKey={key} read={read(key)} /></div></article>; })}</div>
          </section>}

          {profile.role === "super_admin" && failedEvents.length > 0 && <section className="overflow-hidden rounded-3xl border border-[#f0d7d4] bg-white shadow-[var(--shadow-sm)]">
            <div className="border-b border-[#f0d7d4] bg-[#fff9f8] px-5 py-4 sm:px-6"><h2 className="font-semibold text-[#94433d]">Message delivery failures</h2><p className="mt-1 text-xs text-[#8b6865]">Automated care messages that require configuration or contact review.</p></div>
            <div className="divide-y divide-[var(--color-border)]">{failedEvents.map((event) => { const key = failedEventKey(event.id); return <article key={event.id} className="p-5 sm:px-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--color-text)]">{event.workers?.full_name ?? "Unknown worker"}</p><p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{event.workers?.departments?.name ?? "Department"} · {event.event_type.replaceAll("_", " ")}</p></div><StatusBadge tone="danger">Failed</StatusBadge></div>{event.error_message && <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#8b6865]">{event.error_message}</p>}<div className="mt-4 flex flex-wrap items-center gap-3"><Link href="/app/follow-ups" className="text-xs font-semibold text-[var(--color-primary)]">Inspect delivery</Link><NotificationControls notificationKey={key} read={read(key)} /></div></article>; })}</div>
          </section>}
        </div>
      )}

      {snoozedNotifications.length > 0 && (
        <section className="mt-8 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-5 py-4 sm:px-6"><h2 className="font-semibold text-[var(--color-text)]">Snoozed notifications</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Hidden from the active list for 24 hours unless restored sooner.</p></div>
          <div className="divide-y divide-[var(--color-border)]">{snoozedNotifications.map((notification) => <article key={notification.key} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="text-sm font-semibold text-[var(--color-text)]">{notification.title}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">{notification.detail}{notification.until ? ` · returns ${new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(notification.until))}` : ""}</p></div><NotificationControls notificationKey={notification.key} read snoozed /></article>)}</div>
        </section>
      )}
    </div>
  );
}
