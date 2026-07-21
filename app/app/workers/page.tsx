import Link from "next/link";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { MetricPill } from "@/components/workspace-ui";
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Worker directory", description: "Manage the church workforce directory and roster status." };

type WorkerSearchParams = {
  message?: string;
  error?: string;
  q?: string;
  status?: string;
  department?: string;
  sex?: string;
};

function statusStyle(status: string) {
  if (status === "Active") return "bg-[#edf7f1] text-[#347457]";
  if (status === "On Leave") return "bg-[#fff3dc] text-[#9a6818]";
  return "bg-[#f1f3f6] text-[#68738a]";
}

export default async function WorkersPage({ searchParams }: { searchParams: Promise<WorkerSearchParams> }) {
  await requireSuperAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const [departmentsResult, activeResult, leaveResult, inactiveResult] = await Promise.all([
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("workers").select("*", { count: "exact", head: true }).eq("status", "Active"),
    supabase.from("workers").select("*", { count: "exact", head: true }).eq("status", "On Leave"),
    supabase.from("workers").select("*", { count: "exact", head: true }).eq("status", "Inactive"),
  ]);
  const departments = departmentsResult.data;

  let query = supabase
    .from("workers")
    .select("id, full_name, phone_number, sex, status, whatsapp_opt_in, joined_at, department_id, departments(name)")
    .order("full_name");
  if (params.q) query = query.ilike("full_name", `%${params.q}%`);
  if (params.status) query = query.eq("status", params.status);
  if (params.department) query = query.eq("department_id", params.department);
  if (params.sex) query = query.eq("sex", params.sex);
  const { data: workers, error } = await query;
  const hasFilters = Boolean(params.q || params.status || params.department || params.sex);

  return (
    <div className="mx-auto max-w-7xl">
      <WorkspaceNotice message={params.message} error={params.error ?? error?.message} />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">Workforce information</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Worker directory</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">Manage worker information and the people included in department attendance.</p>
        </div>
        <Link href="/app/workers/new" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(79,125,243,0.2)] transition hover:bg-[var(--color-primary-strong)] sm:w-auto">Add worker</Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Workforce status summary">
        <MetricPill value={(activeResult.count ?? 0) + (leaveResult.count ?? 0) + (inactiveResult.count ?? 0)} label="total workers" />
        <MetricPill value={activeResult.count ?? 0} label="active" />
        <MetricPill value={leaveResult.count ?? 0} label="on leave" tone={(leaveResult.count ?? 0) > 0 ? "warning" : "neutral"} />
        <MetricPill value={inactiveResult.count ?? 0} label="inactive" />
      </div>

      <form className="mt-7 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_150px_150px_200px_auto_auto] xl:items-end">
          <label className="text-sm font-semibold text-[var(--color-text-secondary)]">
            Search workers
            <input name="q" defaultValue={params.q} placeholder="Enter a worker's name" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none transition focus:border-[var(--color-primary)]" />
          </label>
          <label className="text-sm font-semibold text-[var(--color-text-secondary)]">
            Status
            <select name="status" defaultValue={params.status ?? ""} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal">
              <option value="">All statuses</option><option>Active</option><option>On Leave</option><option>Inactive</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-[var(--color-text-secondary)]">
            Sex
            <select name="sex" defaultValue={params.sex ?? ""} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal">
              <option value="">All</option><option>Male</option><option>Female</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-[var(--color-text-secondary)]">
            Department
            <select name="department" defaultValue={params.department ?? ""} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal">
              <option value="">All departments</option>
              {departments?.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
          </label>
          <button className="min-h-12 rounded-xl bg-[var(--color-primary-soft)] px-5 text-sm font-semibold text-[var(--color-primary-strong)] transition hover:bg-[#dfe8ff]">Apply filters</button>
          {hasFilters && <Link href="/app/workers" className="flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-border)] px-5 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]">Clear</Link>}
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-[var(--color-text-secondary)]"><span className="font-semibold text-[var(--color-text)]">{workers?.length ?? 0}</span> worker{workers?.length === 1 ? "" : "s"} found</p>
        {hasFilters && <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-strong)]">Filtered view</span>}
      </div>

      {workers?.length ? (
        <>
          <div className="mt-3 hidden overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)] md:block">
            <table className="w-full border-collapse text-left">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                <tr><th className="px-6 py-4">Worker</th><th className="px-4 py-4">Sex</th><th className="px-4 py-4">Department</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">WhatsApp care</th><th className="px-6 py-4 text-right"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody className="divide-y divide-[#edf0f6]">
                {workers.map((worker) => {
                  const department = worker.departments as unknown as { name: string } | null;
                  return (
                    <tr key={worker.id} className="transition hover:bg-[#fafbfe]">
                      <td className="px-6 py-4"><p className="text-sm font-semibold text-[#253252]">{worker.full_name}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">{worker.phone_number ?? "No phone number"}</p></td>
                      <td className="px-4 py-4 text-sm text-[var(--color-text-secondary)]">{worker.sex ?? "Not recorded"}</td>
                      <td className="px-4 py-4 text-sm text-[var(--color-text-secondary)]">{department?.name ?? "Not assigned"}</td>
                      <td className="px-4 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(worker.status)}`}>{worker.status}</span></td>
                      <td className="px-4 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${worker.whatsapp_opt_in ? "bg-[#edf7f1] text-[#347457]" : "bg-[#f3f4f7] text-[#7b8495]"}`}>{worker.whatsapp_opt_in ? "Enabled" : "Off"}</span></td>
                      <td className="px-6 py-4 text-right"><Link href={`/app/workers/${worker.id}/edit`} aria-label={`Edit ${worker.full_name}`} className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-[var(--color-primary-strong)] hover:bg-[var(--color-primary-soft)]">Edit</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 space-y-3 md:hidden">
            {workers.map((worker) => {
              const department = worker.departments as unknown as { name: string } | null;
              return (
                <article key={worker.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-base font-semibold text-[#253252]">{worker.full_name}</h2><p className="mt-1 text-sm text-[var(--color-text-muted)]">{worker.phone_number ?? "No phone number"}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(worker.status)}`}>{worker.status}</span></div>
                  <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-[#edf0f6] py-4">
                    <div><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Sex</dt><dd className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">{worker.sex ?? "Not recorded"}</dd></div>
                    <div><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Department</dt><dd className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">{department?.name ?? "Not assigned"}</dd></div>
                    <div><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">WhatsApp care</dt><dd className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">{worker.whatsapp_opt_in ? "Enabled" : "Off"}</dd></div>
                  </dl>
                  <Link href={`/app/workers/${worker.id}/edit`} className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary-strong)]">Edit worker</Link>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-3xl border border-dashed border-[var(--color-border)] bg-white px-6 py-16 text-center"><p className="text-base font-semibold text-[#526078]">No workers found</p><p className="mt-2 text-sm text-[var(--color-text-muted)]">Add a worker or adjust the current filters.</p></div>
      )}
    </div>
  );
}
