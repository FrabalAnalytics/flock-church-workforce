import Link from "next/link";
import { redirect } from "next/navigation";
import {
  changeServiceAttendanceStatus,
  recordServiceReminder,
  scheduleServiceDay,
} from "@/app/app/service-days/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ServiceDayActionForm } from "@/components/service-day-action-form";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { EmptyState, MetricPill, PageHeader, StatusBadge } from "@/components/workspace-ui";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Service-day control",
  description: "Schedule services and monitor expected department attendance submissions.",
};

const serviceTypes = [
  "Sunday Service",
  "Tuesday Service",
  "Special Service",
  "Headquarters Service",
  "Tarry Night",
];

type ServiceRow = {
  id: string;
  service_date: string;
  service_type: string;
  attendance_status: "open" | "closed";
  attendance_closed_at: string | null;
};

type ExpectationRow = {
  service_id: string;
  department_id: string;
  reminder_count: number;
  last_reminded_at: string | null;
  departments: { name: string } | null;
};

type SubmissionRow = {
  service_id: string;
  department_id: string;
  submitted_at: string;
  roster_count: number;
  present_count: number;
};

type ControlEventRow = {
  id: string;
  event_type: "scheduled" | "reminder_recorded" | "attendance_closed" | "attendance_reopened";
  detail: string | null;
  created_at: string;
  departments: { name: string } | null;
  profiles: { full_name: string } | null;
};

const eventLabels: Record<ControlEventRow["event_type"], string> = {
  scheduled: "Schedule updated",
  reminder_recorded: "Reminder recorded",
  attendance_closed: "Attendance closed",
  attendance_reopened: "Attendance reopened",
};

function lagosDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function validDate(value?: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") ? value! : lagosDate();
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function displayTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

export default async function ServiceDaysPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; message?: string; error?: string }>;
}) {
  const { profile } = await requireProfile();
  if (profile.role === "department_head") redirect("/app");

  const params = await searchParams;
  const selectedDate = validDate(params.date);
  const today = lagosDate();
  const returnTo = `/app/service-days?date=${selectedDate}`;
  const supabase = await createClient();
  const [servicesResult, departmentsResult] = await Promise.all([
    supabase
      .from("services")
      .select("id, service_date, service_type, attendance_status, attendance_closed_at")
      .eq("service_date", selectedDate)
      .order("service_type"),
    supabase.from("departments").select("id, name").order("name"),
  ]);
  const services = (servicesResult.data ?? []) as ServiceRow[];
  const serviceIds = services.map((service) => service.id);
  const [expectationsResult, submissionsResult, eventsResult] = serviceIds.length
    ? await Promise.all([
        supabase
          .from("service_department_expectations")
          .select("service_id, department_id, reminder_count, last_reminded_at, departments(name)")
          .in("service_id", serviceIds)
          .order("created_at"),
        supabase
          .from("attendance_submissions")
          .select("service_id, department_id, submitted_at, roster_count, present_count")
          .in("service_id", serviceIds),
        supabase
          .from("service_control_events")
          .select("id, event_type, detail, created_at, departments(name), profiles!service_control_events_actor_id_fkey(full_name)")
          .in("service_id", serviceIds)
          .order("created_at", { ascending: false })
          .limit(20),
      ])
    : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
  const expectations = (expectationsResult.data ?? []) as unknown as ExpectationRow[];
  const submissions = (submissionsResult.data ?? []) as SubmissionRow[];
  const events = (eventsResult.data ?? []) as unknown as ControlEventRow[];
  const submissionMap = new Map(
    submissions.map((submission) => [`${submission.service_id}:${submission.department_id}`, submission]),
  );
  const submittedCount = expectations.filter((expectation) =>
    submissionMap.has(`${expectation.service_id}:${expectation.department_id}`),
  ).length;
  const pendingCount = expectations.length - submittedCount;
  const lateCount = selectedDate < today ? pendingCount : 0;
  const error = params.error
    ?? servicesResult.error?.message
    ?? departmentsResult.error?.message
    ?? expectationsResult.error?.message
    ?? submissionsResult.error?.message
    ?? eventsResult.error?.message;

  return (
    <div className="mx-auto max-w-7xl">
      <WorkspaceNotice message={params.message} error={error} />
      <PageHeader
        eyebrow="Ministry operations"
        title="Service-day control"
        description="Schedule expected attendance, monitor department submissions, and close the service when reporting is complete."
        actions={<Link href="/app/attendance" className="flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-5 text-sm font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-sm)]">Attendance history</Link>}
      />

      <section className="mt-6 rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs font-semibold text-[var(--color-text-secondary)]">
            Service date
            <input type="date" name="date" defaultValue={selectedDate} className="mt-2 h-11 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm font-normal outline-none focus:border-[var(--color-primary)]" />
          </label>
          <button className="min-h-11 rounded-xl bg-[var(--color-primary-soft)] px-5 text-sm font-semibold text-[var(--color-primary-strong)]">View day</button>
          {selectedDate !== today && <Link href="/app/service-days" className="flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-border)] px-5 text-sm font-semibold text-[var(--color-text-secondary)]">Today</Link>}
        </form>
      </section>

      <div className="mt-5 flex flex-wrap gap-2">
        <MetricPill label="Expected" value={expectations.length} />
        <MetricPill label="Submitted" value={submittedCount} />
        <MetricPill label="Pending" value={pendingCount} tone={pendingCount ? "warning" : "neutral"} />
        <MetricPill label="Late" value={lateCount} tone={lateCount ? "danger" : "neutral"} />
      </div>

      {profile.role === "super_admin" && (
        <details className="mt-6 rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]" open={!services.length}>
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-[var(--color-text)] sm:px-6">Schedule or update a service</summary>
          <form action={scheduleServiceDay} className="grid gap-5 border-t border-[var(--color-border)] px-5 py-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="grid content-start gap-4">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Date<input type="date" name="service_date" required defaultValue={selectedDate} className="mt-2 h-11 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm font-normal" /></label>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Service type<select name="service_type" required className="mt-2 h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal"><option value="">Select service</option>{serviceTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            </div>
            <fieldset>
              <legend className="text-xs font-semibold text-[var(--color-text-secondary)]">Expected departments</legend>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Scheduling an existing service updates its expected departments.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(departmentsResult.data ?? []).map((department) => (
                  <label key={department.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text-secondary)]">
                    <input type="checkbox" name="department_ids" value={department.id} defaultChecked className="h-4 w-4 accent-[var(--color-primary)]" />
                    {department.name}
                  </label>
                ))}
              </div>
              <FormSubmitButton pendingLabel="Scheduling..." className="mt-4 min-h-11 w-full rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">Schedule service</FormSubmitButton>
            </fieldset>
          </form>
        </details>
      )}

      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">Selected day</p><h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">{displayDate(selectedDate)}</h2></div>
          {expectations.length > 0 && <p className="text-sm font-medium text-[var(--color-text-muted)]">{submittedCount} of {expectations.length} submissions received</p>}
        </div>

        {services.length ? (
          <div className="mt-4 space-y-5">
            {services.map((service) => {
              const expected = expectations.filter((item) => item.service_id === service.id);
              const received = expected.filter((item) => submissionMap.has(`${service.id}:${item.department_id}`)).length;
              const isClosed = service.attendance_status === "closed";
              return (
                <article key={service.id} className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
                  <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-[var(--color-text)]">{service.service_type}</h3><StatusBadge tone={isClosed ? "neutral" : "success"}>{isClosed ? "Closed" : "Open"}</StatusBadge></div><p className="mt-1 text-xs text-[var(--color-text-muted)]">{received} of {expected.length} expected departments submitted{service.attendance_closed_at ? ` · Closed ${displayTime(service.attendance_closed_at)}` : ""}</p></div>
                    {profile.role === "super_admin" && (
                      <ServiceDayActionForm
                        action={changeServiceAttendanceStatus}
                        fields={{ service_id: service.id, status: isClosed ? "open" : "closed", return_to: returnTo }}
                        confirmation={isClosed ? `Reopen ${service.service_type} attendance? Department heads will be able to submit again.` : `Close ${service.service_type} attendance? Pending departments will no longer be able to submit until it is reopened.`}
                        pendingLabel={isClosed ? "Reopening..." : "Closing..."}
                        className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${isClosed ? "border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]" : "bg-[var(--color-text)] text-white"}`}
                      >
                        {isClosed ? "Reopen attendance" : "Close attendance"}
                      </ServiceDayActionForm>
                    )}
                  </div>
                  {expected.length ? (
                    <div className="divide-y divide-[var(--color-border)]">
                      {expected.map((expectation) => {
                        const submission = submissionMap.get(`${service.id}:${expectation.department_id}`);
                        const isLate = !submission && selectedDate < today;
                        return (
                          <div key={expectation.department_id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
                            <div>
                              <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-[var(--color-text)]">{expectation.departments?.name ?? "Department"}</p><StatusBadge tone={submission ? "success" : isLate ? "danger" : "warning"}>{submission ? "Submitted" : isLate ? "Late" : "Pending"}</StatusBadge></div>
                              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{submission ? `${submission.present_count} of ${submission.roster_count} present · Submitted ${displayTime(submission.submitted_at)}` : expectation.last_reminded_at ? `Reminder recorded ${displayTime(expectation.last_reminded_at)} · ${expectation.reminder_count} total` : "No reminder recorded"}</p>
                            </div>
                            {!submission && !isClosed && profile.role === "super_admin" && (
                              <ServiceDayActionForm
                                action={recordServiceReminder}
                                fields={{ service_id: service.id, department_id: expectation.department_id, return_to: returnTo }}
                                confirmation={`Record that a reminder was sent to ${expectation.departments?.name ?? "this department"}? This does not send a message automatically.`}
                                pendingLabel="Recording..."
                                className="min-h-10 rounded-xl border border-[var(--color-border)] bg-white px-4 text-xs font-semibold text-[var(--color-primary-strong)] hover:bg-[var(--color-primary-soft)]"
                              >
                                Mark reminder sent
                              </ServiceDayActionForm>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : <div className="p-5 sm:p-6"><EmptyState title="No departments expected" description="Update this service schedule and choose the departments expected to submit attendance." /></div>}
                </article>
              );
            })}
          </div>
        ) : <div className="mt-4"><EmptyState title="No service scheduled" description="There is no scheduled service for this date. Super admins can create one above." /></div>}
      </section>

      {events.length > 0 && (
        <section className="mt-6 rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6" aria-labelledby="service-activity-title">
          <div><h2 id="service-activity-title" className="text-lg font-semibold text-[var(--color-text)]">Service-day activity</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Recent schedule, reminder, and attendance-control events for this date.</p></div>
          <ol className="mt-4 divide-y divide-[var(--color-border)]">
            {events.map((event) => (
              <li key={event.id} className="grid gap-1 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4">
                <div><p className="text-sm font-semibold text-[var(--color-text)]">{eventLabels[event.event_type]}{event.departments?.name ? ` · ${event.departments.name}` : ""}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">By {event.profiles?.full_name ?? "System"}{event.detail ? ` · ${event.detail}` : ""}</p></div>
                <time dateTime={event.created_at} className="text-xs font-medium text-[var(--color-text-muted)]">{displayTime(event.created_at)}</time>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
