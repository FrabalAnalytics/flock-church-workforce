import Link from "next/link";
import { correctSubmittedAttendance } from "@/app/app/attendance/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default async function AttendanceHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { profile } = await requireProfile();
  const params = await searchParams;
  const supabase = await createClient();
  const { data: submissions, error } = await supabase
    .from("attendance_submissions")
    .select(`
      id,
      roster_count,
      present_count,
      absent_count,
      submitted_at,
      corrected_at,
      departments(name),
      services(service_date, service_type),
      attendance_logs(worker_id, status, workers(id, full_name))
    `)
    .order("submitted_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl">
      <WorkspaceNotice message={params.message} error={params.error ?? error?.message} />
      <PageHeader eyebrow="Worker service records" title="Worker attendance history" description="Review department submissions and each worker's attendance status." actions={profile.role === "department_head" ? <Link href="/app/attendance/new" className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(79,125,243,0.2)] hover:bg-[var(--color-primary-strong)] sm:w-auto">Log worker attendance</Link> : undefined} />
      <div className="mt-6 flex flex-wrap gap-2">
        <MetricPill value={submissions?.length ?? 0} label="submissions" />
        <MetricPill value={submissions?.reduce((total, submission) => total + submission.present_count, 0) ?? 0} label="present records" />
        <MetricPill value={submissions?.reduce((total, submission) => total + submission.absent_count, 0) ?? 0} label="absent records" tone={submissions?.some((submission) => submission.absent_count > 0) ? "warning" : "neutral"} />
      </div>

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
                    <form action={correctSubmittedAttendance} className="mt-4">
                      <input type="hidden" name="submission_id" value={submission.id} />
                      <div className="grid gap-2 sm:grid-cols-2">
                        {logs.map((log) => (
                          <label key={log.worker_id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e3e8f2] bg-white px-3 py-3 text-sm font-medium text-[#34415f]">
                            <input type="checkbox" name="present_worker_ids" value={log.worker_id} defaultChecked={log.status === "Present"} className="h-4 w-4 accent-[#4f7df3]" />
                            <span>{log.workers?.full_name ?? "Unknown worker"}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 flex justify-end"><FormSubmitButton pendingLabel="Saving correction..." className="min-h-12 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)] disabled:cursor-wait disabled:opacity-60">Save correction</FormSubmitButton></div>
                    </form>
                  </details>
                )}
              </div>
            </details>
          );
        }) : (
          <EmptyState title="No worker attendance has been submitted yet" description="Completed department attendance will appear here." action={profile.role === "department_head" ? <Link href="/app/attendance/new" className="inline-flex min-h-11 items-center rounded-xl bg-[var(--color-primary-soft)] px-5 text-sm font-semibold text-[var(--color-primary-strong)]">Log worker attendance</Link> : undefined} />
        )}
      </div>
    </div>
  );
}
