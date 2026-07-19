import { createDepartment, renameDepartment } from "@/app/app/admin/actions";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export default async function DepartmentsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  await requireSuperAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: departments }, { data: workers }] = await Promise.all([
    supabase.from("departments").select("id, name, created_at").order("name"),
    supabase.from("workers").select("department_id"),
  ]);
  const counts = new Map<string, number>();
  workers?.forEach((worker) => counts.set(worker.department_id, (counts.get(worker.department_id) ?? 0) + 1));

  return <div className="mx-auto max-w-6xl">
    <WorkspaceNotice message={params.message} error={params.error} />
    <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#4f7df3]">Structure</p>
    <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Departments</h1>
    <p className="mt-2 text-sm text-[#758097]">Create and rename the ministry departments used across Flock.</p>
    <form action={createDepartment} className="mt-8 flex max-w-xl gap-3 rounded-2xl border border-[#e0e6f2] bg-white p-3"><input name="name" required placeholder="New department name" className="min-w-0 flex-1 rounded-xl border border-[#dce3f1] px-4 text-sm outline-none focus:border-[#4f7df3]" /><button className="rounded-xl bg-[#4f7df3] px-5 py-3 text-sm font-semibold text-white">Add department</button></form>
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{departments?.map((department) => <article key={department.id} className="rounded-3xl border border-[#e0e6f2] bg-white p-5"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf2ff] text-sm font-semibold text-[#4f7df3]">{department.name.slice(0, 2).toUpperCase()}</span><span className="text-xs text-[#8993a7]">{counts.get(department.id) ?? 0} workers</span></div><form action={renameDepartment} className="mt-5 flex gap-2"><input type="hidden" name="id" value={department.id} /><input name="name" defaultValue={department.name} required className="min-w-0 flex-1 rounded-xl border border-[#e0e6f2] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#4f7df3]" /><button className="rounded-xl bg-[#f3f6fc] px-3 text-xs font-semibold text-[#536078] hover:bg-[#eaf0fb]">Save</button></form></article>)}</div>
  </div>;
}
