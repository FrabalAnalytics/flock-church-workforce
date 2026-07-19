import Link from "next/link";
import { correctSubmittedAttendance } from "@/app/app/attendance/actions";
import { WorkspaceNotice } from "@/components/workspace-notice";
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
    <div className="mx-auto max-w-6xl">
      <WorkspaceNotice message={params.message} error={params.error ?? error?.message} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#4f7df3]">Service records</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Attendance history</h1>
          <p className="mt-2 text-sm text-[#758097]">Review completed department submissions and individual attendance.</p>
        </div>
        {profile.role === "department_head" && (
          <Link href="/app/attendance/new" className="w-fit rounded-xl bg-[#4f7df3] px-5 py-3 text-sm font-semibold text-white">Log attendance</Link>
        )}
      </div>

      <div className="mt-8 space-y-5">
        {submissions?.length ? submissions.map((submission) => {
          const service = submission.services as unknown as { service_date: string; service_type: string } | null;
          const department = submission.departments as unknown as { name: string } | null;
          const logs = (submission.attendance_logs ?? []) as unknown as AttendanceLog[];
          return (
            <details key={submission.id} className="group overflow-hidden rounded-3xl border border-[#e0e6f2] bg-white">
              <summary className="cursor-pointer list-none p-5 sm:p-6">
                <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="text-lg font-semibold text-[#253252]">{service?.service_type ?? "Service"}</p>
                    <p className="mt-1 text-sm text-[#7b8599]">{service ? formatDate(service.service_date) : "Unknown date"} · {department?.name ?? "Department"}</p>
                    {submission.corrected_at && <p className="mt-1 text-xs font-medium text-[#8a6b22]">Corrected {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(submission.corrected_at))}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-[#f2f5fb] px-3 py-1.5 text-[#617087]">Roster {submission.roster_count}</span>
                    <span className="rounded-full bg-[#edf7f1] px-3 py-1.5 text-[#347457]">Present {submission.present_count}</span>
                    <span className="rounded-full bg-[#fff1f0] px-3 py-1.5 text-[#b5524b]">Absent {submission.absent_count}</span>
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
                      <div className="mt-4 flex justify-end"><button className="rounded-xl bg-[#4f7df3] px-4 py-2.5 text-sm font-semibold text-white">Save correction</button></div>
                    </form>
                  </details>
                )}
              </div>
            </details>
          );
        }) : (
          <div className="rounded-3xl border border-dashed border-[#d8dfed] bg-white px-6 py-16 text-center">
            <p className="font-semibold text-[#526078]">No attendance has been submitted yet</p>
            <p className="mt-2 text-sm text-[#929bad]">Completed service attendance will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
