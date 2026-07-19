import { createMinister, updateMinister } from "@/app/app/admin/actions";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export default async function MinistersPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const { data: ministers, error } = await supabase
    .from("ministers")
    .select("id, title, full_name, active")
    .order("active", { ascending: false })
    .order("full_name");

  return (
    <div className="mx-auto max-w-6xl">
      <WorkspaceNotice message={params.message} error={params.error ?? error?.message} />
      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#4f7df3]">Service setup</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Minister Directory</h1>
      <p className="mt-2 text-sm text-[#758097]">Maintain consistent minister names for church-attendance records. Deactivate a minister to preserve history while removing them from future selection.</p>

      <form action={createMinister} className="mt-8 grid gap-3 rounded-2xl border border-[#e0e6f2] bg-white p-4 sm:grid-cols-[0.55fr_1fr_auto]">
        <input name="title" maxLength={40} placeholder="Title (e.g. Pastor)" className="h-11 rounded-xl border border-[#dce3f1] px-4 text-sm outline-none focus:border-[#4f7df3]" />
        <input name="full_name" minLength={2} maxLength={120} required placeholder="Minister's full name" className="h-11 rounded-xl border border-[#dce3f1] px-4 text-sm outline-none focus:border-[#4f7df3]" />
        <button className="rounded-xl bg-[#4f7df3] px-5 py-3 text-sm font-semibold text-white">Add minister</button>
      </form>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {ministers?.map((minister) => (
          <form action={updateMinister} key={minister.id} className="rounded-3xl border border-[#e0e6f2] bg-white p-5">
            <input type="hidden" name="id" value={minister.id} />
            <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8993a7]">Minister record</p><span className={`rounded-full px-3 py-1 text-xs font-semibold ${minister.active ? "bg-[#edf8f1] text-[#2f7b50]" : "bg-[#f0f1f4] text-[#70798b]"}`}>{minister.active ? "Active" : "Inactive"}</span></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[0.6fr_1fr]">
              <label className="text-xs font-semibold text-[#68738a]">Title<input name="title" maxLength={40} defaultValue={minister.title ?? ""} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] px-3 text-sm font-normal" /></label>
              <label className="text-xs font-semibold text-[#68738a]">Full name<input name="full_name" minLength={2} maxLength={120} required defaultValue={minister.full_name} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] px-3 text-sm font-normal" /></label>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm font-medium text-[#5f6b82]"><input type="checkbox" name="active" defaultChecked={minister.active} className="h-4 w-4 accent-[#4f7df3]" /> Available for new services</label><button className="rounded-xl bg-[#f1f5fc] px-4 py-2.5 text-xs font-semibold text-[#536078]">Save changes</button></div>
          </form>
        ))}
        {!ministers?.length && <p className="rounded-2xl border border-dashed border-[#d9e1ef] px-5 py-12 text-center text-sm text-[#8993a7] lg:col-span-2">No ministers have been added yet.</p>}
      </div>
    </div>
  );
}
