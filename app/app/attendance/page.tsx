import Link from "next/link";
import { AttendanceCorrectionForm } from "@/components/attendance-correction-form";
import { AttendanceDraftCleanup } from "@/components/attendance-draft-cleanup";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { EmptyState, MetricPill, PageHeader, StatusBadge } from "@/components/workspace-ui";

export const metadata = { title: "Worker attendance", description: "Review submitted department worker attendance." };
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type AttendanceLog = {
  worker_id: string;
  status: "Present" | "Absent";
  workers: { id: string; full_name: string } | null;
};

const serviceTypes = [
  "Sunday Service",
  "Tuesday Service",
  "Special Service",
  "Headquarters Service",
  "Tarry Night",
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

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

export default async function AttendanceHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string;
    error?: string;
    from?: string;
    to?: string;
    service?: string;
    department?: string;
    clear_attendance_draft?: string;
  }>;
}) {
  const { profile } = await requireProfile();
  const params = await searchParams;
  const expectedDraftKey = profile.role === "department_head" && profile.department_id
    ? `flock:attendance-draft:v1:${profile.department_id}:${lagosDate()}`
    : "";
  const draftToClear = params.clear_attendance_draft === expectedDraftKey ? expectedDraftKey : "";
  const supabase = await createClient();
  const canFilterDepartments = profile.role === "super_admin" || profile.role === "church_leader";
  const service = serviceTypes.includes(params.service ?? "") ? params.service : "";
  const department = canFilterDepartments && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.department ?? "") ? params.department! : "";
  let submissionsQuery = supabase
    .from("attendance_submissions")
    .select(`
      id,
      department_id,
      roster_count,
      present_count,
      absent_count,
      submitted_at,
      corrected_at,
      departments(name),
      services!inner(service_date, service_type),
      attendance_logs(worker_id, status, workers(id, full_name))
    `)
    .order("submitted_at", { ascending: false })
    .limit(500);

  if (params.from) submissionsQuery = submissionsQuery.gte("services.service_date", params.from);
  if (params.to) submissionsQuery = submissionsQuery.lte("services.service_date", params.to);
  if (service) submissionsQuery = submissionsQuery.eq("services.service_type", service);
  if (department) submissionsQuery = submissionsQuery.eq("department_id", department);

  const [{ data: submissions, error }, { data: departments, error: departmentsError }] = await Promise.all([
    submissionsQuery,
    supabase.from("departments").select("id, name").order("name"),
  ]);
  const hasFilters = Boolean(params.from || params.to || service || department);
  const returnParams = new URLSearchParams();
  if (params.from) returnParams.set("from", params.from);
  if (params.to) returnParams.set("to", params.to);
  if (service) returnParams.set("service", service);
  if (department) returnParams.set("department", department);
  const returnTo = `/app/attendance${returnParams.size ? `?${returnParams}` : ""}`;

  return (
    <div className="mx-auto max-w-7xl">
      {draftToClear && <AttendanceDraftCleanup draftKey={draftToClear} />}
      <WorkspaceNotice message={params.message} error={params.error ?? error?.message ?? departmentsError?.message} />
      <PageHeader eyebrow="Worker service records" title="Worker attendance history" description="Review department submissions and each worker's attendance status." actions={profile.role === "department_head" ? <Link href="/app/attendance/new" className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(79,125,243,0.2)] hover:bg-[var(--color-primary-strong)] sm:w-auto">Log worker attendance</Link> : undefined} />
      <div className="mt-6 flex flex-wrap gap-2">
        <MetricPill value={submissions?.length ?? 0} label="submissions" />
        <MetricPill value={submissions?.reduce((total, submission) => total + submission.present_count, 0) ?? 0} label="present records" />
        <MetricPill value={submissions?.reduce((total, submission) => total + submission.absent_count, 0) ?? 0} label="absent records" tone={submissions?.some((submission) => submission.absent_count > 0) ? "warning" : "neutral"} />
      </div>

      <section className="mt-7 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5" aria-label="Filter worker attendance">
        <form className={`grid gap-4 sm:grid-cols-2 xl:items-end ${canFilterDepartments ? "xl:grid-cols-[1fr_1fr_1.2fr_1.2fr_auto]" : "xl:grid-cols-[1fr_1fr_1.2fr_auto]"}`}>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">From date<input type="date" name="from" defaultValue={params.from ?? ""} max={params.to} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]" /></label>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">To date<input type="date" name="to" defaultValue={params.to ?? ""} min={params.from} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]" /></label>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Service type<select name="service" defaultValue={service ?? ""} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"><option value="">All services</option>{serviceTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          {canFilterDepartments && <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Department<select name="department" defaultValue={department} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"><option value="">All departments</option>{departments?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
          <button className="min-h-12 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)]">Apply filters</button>
        </form>
        <div className="mt-4 flex flex-col gap-2 border-t border-[var(--color-border)] pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[var(--color-text-secondary)]"><strong className="font-semibold text-[var(--color-text)]">{submissions?.length ?? 0}</strong> {(submissions?.length ?? 0) === 1 ? "submission" : "submissions"} shown{hasFilters ? " for the selected filters" : " across all available records"}.</p>
          {hasFilters && <Link href="/app/attendance" className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-strong)]">Clear filters</Link>}
        </div>
      </section>

      <div className="mt-8 space-y-5">
        {submissions?.length ? submissions.map((submission) => {
          const service = submission.services as unknown as { service_date: string; service_type: string } | null;
          const department = submission.departments as unknown as { name: string } | null;
          const logs = (submission.attendance_logs ?? []) as unknown as AttendanceLog[];
          return (
            <details key={submission.id} className="group overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
              <summary className="cursor-pointer list-none p-5 sm:p-6">
                <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="text-lg font-semibold text-[#253252]">{service?.service_type ?? "Service"}</p>
                    <p className="mt-1 text-sm text-[#7b8599]">{service ? formatDate(service.service_date) : "Unknown date"} · {department?.name ?? "Department"}</p>
                    {submission.corrected_at && <p className="mt-1 text-xs font-medium text-[#8a6b22]">Corrected {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(submission.corrected_at))}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <StatusBadge>Roster {submission.roster_count}</StatusBadge>
                    <StatusBadge tone="success">Present {submission.present_count}</StatusBadge>
                    <StatusBadge tone={submission.absent_count ? "danger" : "neutral"}>Absent {submission.absent_count}</StatusBadge>
                  </div>
                </div>
                <p className="mt-4 text-xs font-semibold text-[#4f7df3] group-open:hidden">Show individual records</p>
              </summary>
              <div className="border-t border-[#edf0f6] px-5 py-3 sm:px-6">
                {logs.length ? logs
                  .sort((a, b) => (a.workers?.full_name ?? "").localeCompare(b.workers?.full_name ?? ""))
                  .map((log, index) => (
                    <div key={`${log.workers?.full_name ?? "worker"}-${index}`} className="flex items-center justify-between border-b border-[#f0f2f7] py-3 last:border-0">
                      <p className="text-sm font-medium text-[#34415f]">{log.workers?.full_name ?? "Unknown worker"}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${log.status === "Present" ? "bg-[#edf7f1] text-[#347457]" : "bg-[#fff1f0] text-[#b5524b]"}`}>{log.status}</span>
                    </div>
                  )) : <p className="py-5 text-sm text-[#8993a7]">No individual records are available.</p>}
                {profile.role === "super_admin" && logs.length > 0 && (
                  <details className="my-3 rounded-2xl border border-[#dce3f1] bg-[#f8faff] p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-[#4168cd]">Correct submitted attendance</summary>
                    <p className="mt-2 text-xs leading-5 text-[#758097]">Select every worker who was present. The original service, department, and submitted roster cannot be changed.</p>
                    <AttendanceCorrectionForm submissionId={submission.id} serviceLabel={`${service?.service_type ?? "Service"} · ${department?.name ?? "Department"}`} rosterCount={submission.roster_count} returnTo={returnTo}>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {logs.map((log) => (
                          <label key={log.worker_id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e3e8f2] bg-white px-3 py-3 text-sm font-medium text-[#34415f]">
                            <input type="checkbox" name="present_worker_ids" value={log.worker_id} defaultChecked={log.status === "Present"} className="h-4 w-4 accent-[#4f7df3]" />
                            <span>{log.workers?.full_name ?? "Unknown worker"}</span>
                          </label>
                        ))}
                      </div>
                    </AttendanceCorrectionForm>
                  </details>
                )}
              </div>
            </details>
          );
        }) : (
          <EmptyState title={hasFilters ? "No attendance matches these filters" : "No worker attendance has been submitted yet"} description={hasFilters ? "Try a wider date range or clear one of the selected filters." : "Completed department attendance will appear here."} action={hasFilters ? <Link href="/app/attendance" className="inline-flex min-h-11 items-center rounded-xl bg-[var(--color-primary-soft)] px-5 text-sm font-semibold text-[var(--color-primary-strong)]">Clear filters</Link> : profile.role === "department_head" ? <Link href="/app/attendance/new" className="inline-flex min-h-11 items-center rounded-xl bg-[var(--color-primary-soft)] px-5 text-sm font-semibold text-[var(--color-primary-strong)]">Log worker attendance</Link> : undefined} />
        )}
      </div>
    </div>
  );
}
