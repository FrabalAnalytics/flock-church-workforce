import Link from "next/link";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export default async function WorkersPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string; q?: string; status?: string; department?: string }> }) {
  await requireSuperAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const { data: departments } = await supabase.from("departments").select("id, name").order("name");
  let query = supabase.from("workers").select("id, full_name, phone_number, status, whatsapp_opt_in, joined_at, department_id, departments(name)").order("full_name");
  if (params.q) query = query.ilike("full_name", `%${params.q}%`);
  if (params.status) query = query.eq("status", params.status);
  if (params.department) query = query.eq("department_id", params.department);
  const { data: workers } = await query;

  return <div className="mx-auto max-w-6xl"><WorkspaceNotice message={params.message} error={params.error} /><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#4f7df3]">Workforce information</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Worker directory</h1><p className="mt-2 text-sm text-[#758097]">Manage worker information and the people included in department attendance.</p></div><Link href="/app/workers/new" className="w-fit rounded-xl bg-[#4f7df3] px-5 py-3 text-sm font-semibold text-white">Add worker</Link></div>
    <form className="mt-7 grid gap-3 rounded-2xl border border-[#e0e6f2] bg-white p-3 sm:grid-cols-[1fr_180px_200px_auto]"><input name="q" defaultValue={params.q} placeholder="Search workers" className="h-11 rounded-xl border border-[#dce3f1] px-4 text-sm outline-none focus:border-[#4f7df3]" /><select name="status" defaultValue={params.status ?? ""} className="h-11 rounded-xl border border-[#dce3f1] bg-white px-3 text-sm"><option value="">All statuses</option><option>Active</option><option>On Leave</option><option>Inactive</option></select><select name="department" defaultValue={params.department ?? ""} className="h-11 rounded-xl border border-[#dce3f1] bg-white px-3 text-sm"><option value="">All departments</option>{departments?.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select><button className="rounded-xl bg-[#edf2ff] px-5 text-sm font-semibold text-[#4168cd]">Filter</button></form>
    <div className="mt-6 overflow-hidden rounded-3xl border border-[#e0e6f2] bg-white"><div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.7fr_auto] gap-4 border-b border-[#e8ecf4] bg-[#f8f9fc] px-6 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#8993a7] md:grid"><span>Worker</span><span>Department</span><span>Status</span><span>WhatsApp</span><span /></div>{workers?.length ? <div className="divide-y divide-[#edf0f6]">{workers.map((worker) => <div key={worker.id} className="grid gap-3 px-5 py-5 md:grid-cols-[1.4fr_1fr_0.8fr_0.7fr_auto] md:items-center md:px-6"><div><p className="text-sm font-semibold text-[#253252]">{worker.full_name}</p><p className="mt-1 text-xs text-[#8993a7]">{worker.phone_number ?? "No phone number"}</p></div><p className="text-sm text-[#5f6b82]">{(worker.departments as unknown as { name: string } | null)?.name ?? "—"}</p><span className="w-fit rounded-full bg-[#f2f5fb] px-3 py-1 text-xs font-medium text-[#617087]">{worker.status}</span><span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${worker.whatsapp_opt_in ? "bg-[#edf7f1] text-[#347457]" : "bg-[#f3f4f7] text-[#7b8495]"}`}>{worker.whatsapp_opt_in ? "Enabled" : "Off"}</span><Link href={`/app/workers/${worker.id}/edit`} className="text-sm font-semibold text-[#4f7df3]">Edit</Link></div>)}</div> : <div className="px-6 py-16 text-center"><p className="text-sm font-semibold text-[#526078]">No workers found</p><p className="mt-2 text-xs text-[#929bad]">Add a worker or adjust the current filters.</p></div>}</div>
  </div>;
}
