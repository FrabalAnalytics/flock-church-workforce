import Link from "next/link";
import { createDepartment, renameDepartment } from "@/app/app/admin/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { EmptyState, MetricPill, PageHeader, StatusBadge } from "@/components/workspace-ui";
import { requireSuperAdmin } from "@/lib/admin";

export const metadata = { title: "Departments", description: "Manage ministry departments used throughout Flock." };
import { createClient } from "@/lib/supabase/server";

type DepartmentHead = {
  id: string;
  full_name: string;
  email: string | null;
  department_id: string | null;
};

export default async function DepartmentsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  await requireSuperAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const [departmentsResult, workersResult, departmentHeadsResult] = await Promise.all([
    supabase.from("departments").select("id, name, created_at").order("name"),
    supabase.from("workers").select("department_id"),
    supabase.from("profiles").select("id, full_name, email, department_id").eq("role", "department_head").order("full_name"),
  ]);
  const departments = departmentsResult.data;
  const workers = workersResult.data;
  const departmentHeads = departmentHeadsResult.data as DepartmentHead[] | null;
  const counts = new Map<string, number>();
  workers?.forEach((worker) => counts.set(worker.department_id, (counts.get(worker.department_id) ?? 0) + 1));
  const headsByDepartment = new Map<string, DepartmentHead[]>();
  departmentHeads?.forEach((head) => {
    if (!head.department_id) return;
    headsByDepartment.set(head.department_id, [...(headsByDepartment.get(head.department_id) ?? []), head]);
  });
  const uncoveredCount = departments?.filter((department) => !(headsByDepartment.get(department.id)?.length)).length ?? 0;
  const largestDepartment = (departments ?? []).reduce<{ name: string; count: number } | null>((largest, department) => {
    const count = counts.get(department.id) ?? 0;
    return !largest || count > largest.count ? { name: department.name, count } : largest;
  }, null);
  const maxCount = Math.max(1, ...Array.from(counts.values()));

  return <div className="mx-auto max-w-7xl">
    <WorkspaceNotice message={params.message} error={params.error ?? departmentsResult.error?.message ?? workersResult.error?.message ?? departmentHeadsResult.error?.message} />
    <PageHeader eyebrow="Church structure" title="Departments" description="Create and rename the ministry departments used for workers, attendance, access and reporting." actions={<a href="#add-department" className="flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] hover:bg-[var(--color-primary-strong)]">Add department</a>} />
    <div className="mt-6 flex flex-wrap gap-2"><MetricPill value={departments?.length ?? 0} label="departments" /><MetricPill value={workers?.length ?? 0} label="workers assigned" /><MetricPill value={departmentHeads?.length ?? 0} label="department heads" />{uncoveredCount > 0 && <MetricPill value={uncoveredCount} label="without a head" tone="warning" />}{largestDepartment && <MetricPill value={largestDepartment.count} label={`in ${largestDepartment.name}`} />}</div>

    <form id="add-department" action={createDepartment} className="mt-7 grid max-w-2xl scroll-mt-24 gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:grid-cols-[1fr_auto] sm:items-end">
      <label className="text-sm font-semibold text-[var(--color-text-secondary)]">New department name<input name="name" minLength={2} required placeholder="e.g. Hospitality" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
      <FormSubmitButton pendingLabel="Adding..." className="min-h-12 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)] disabled:cursor-wait disabled:opacity-60">Add department</FormSubmitButton>
    </form>

    {departments?.length ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{departments.map((department) => {
      const workerCount = counts.get(department.id) ?? 0;
      const heads = headsByDepartment.get(department.id) ?? [];
      return <article key={department.id} className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary)]">{department.name.slice(0, 2).toUpperCase()}</span><span className="rounded-full bg-[var(--color-surface-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)]">{workerCount} {workerCount === 1 ? "worker" : "workers"}</span></div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]" aria-label={`${workerCount} workers in ${department.name}`}><div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${workerCount ? Math.max(8, (workerCount / maxCount) * 100) : 0}%` }} /></div>
        <section className={`mt-5 rounded-2xl border p-4 ${heads.length ? "border-[#dce7df] bg-[#f5faf7]" : "border-[#f0dfbd] bg-[#fffaf0]"}`} aria-label={`${department.name} leadership`}>
          <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Department leadership</p><StatusBadge tone={heads.length ? "success" : "warning"}>{heads.length ? `${heads.length} assigned` : "Unassigned"}</StatusBadge></div>
          {heads.length ? <div className="mt-3 space-y-3">{heads.map((head) => <div key={head.id} className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-[var(--color-primary-strong)] shadow-[var(--shadow-sm)]">{head.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--color-text)]">{head.full_name}</p><p className="truncate text-xs text-[var(--color-text-muted)]">{head.email ?? "Email unavailable"}</p></div></div>)}</div> : <p className="mt-3 text-sm leading-6 text-[#80662f]">Assign a Department Head so attendance and care actions have a clear owner.</p>}
          <Link href={`/app/users?role=department_head&department=${department.id}`} className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-strong)]">{heads.length ? "Manage access" : "Assign a head"} <span aria-hidden="true" className="ml-1">→</span></Link>
        </section>
        <form action={renameDepartment} className="mt-5 grid grid-cols-[1fr_auto] gap-2"><input type="hidden" name="id" value={department.id} /><label className="sr-only" htmlFor={`department-${department.id}`}>Department name</label><input id={`department-${department.id}`} name="name" minLength={2} defaultValue={department.name} required className="h-12 min-w-0 rounded-xl border border-[var(--color-border)] px-3 text-sm font-semibold outline-none focus:border-[var(--color-primary)]" /><FormSubmitButton pendingLabel="Saving..." className="min-h-12 rounded-xl bg-[var(--color-primary-soft)] px-4 text-sm font-semibold text-[var(--color-primary-strong)] disabled:cursor-wait disabled:opacity-60">Save</FormSubmitButton></form>
        <Link href={`/app/workers?department=${department.id}`} className="mt-3 flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]">View department workers</Link>
      </article>;
    })}</div> : <div className="mt-6"><EmptyState title="No departments created" description="Create the first ministry department to begin assigning workers and Department Heads." /></div>}
  </div>;
}
