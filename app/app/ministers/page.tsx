import { createMinister, updateMinister } from "@/app/app/admin/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { EmptyState, MetricPill, PageHeader, StatusBadge } from "@/components/workspace-ui";
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export default async function MinistersPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  await requireSuperAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const { data: ministers, error } = await supabase.from("ministers").select("id, title, full_name, active").order("active", { ascending: false }).order("full_name");
  const activeCount = ministers?.filter((minister) => minister.active).length ?? 0;

  return (
    <div className="mx-auto max-w-7xl">
      <WorkspaceNotice message={params.message} error={params.error ?? error?.message} />
      <PageHeader eyebrow="Service setup" title="Minister directory" description="Keep minister names consistent in congregation-attendance records. Deactivate a minister to preserve history while removing them from future selection." />
      <div className="mt-5 flex flex-wrap gap-2">
        <MetricPill label="Total ministers" value={ministers?.length ?? 0} />
        <MetricPill label="Available" value={activeCount} />
        <MetricPill label="Inactive" value={(ministers?.length ?? 0) - activeCount} />
      </div>
      <form action={createMinister} className="mt-8 grid gap-4 rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:grid-cols-[0.55fr_1fr_auto] sm:items-end sm:p-6">
        <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Title <span className="font-normal text-[var(--color-text-muted)]">(optional)</span><input name="title" maxLength={40} placeholder="e.g. Pastor" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
        <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Full name<input name="full_name" minLength={2} maxLength={120} required placeholder="Enter minister's full name" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
        <FormSubmitButton pendingLabel="Adding minister…" className="min-h-12 w-full rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)] disabled:opacity-60 sm:w-auto">Add minister</FormSubmitButton>
      </form>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {ministers?.map((minister) => (
          <form action={updateMinister} key={minister.id} className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <input type="hidden" name="id" value={minister.id} />
            <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Minister record</p><StatusBadge tone={minister.active ? "success" : "neutral"}>{minister.active ? "Active" : "Inactive"}</StatusBadge></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-[0.6fr_1fr]">
              <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Title<input name="title" maxLength={40} defaultValue={minister.title ?? ""} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
              <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Full name<input name="full_name" minLength={2} maxLength={120} required defaultValue={minister.full_name} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
            </div>
            <div className="mt-5 flex flex-col gap-4 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-[var(--color-text-secondary)]"><input type="checkbox" name="active" defaultChecked={minister.active} className="h-5 w-5 accent-[var(--color-primary)]" />Available for new services</label>
              <FormSubmitButton pendingLabel="Saving…" className="min-h-11 w-full rounded-xl bg-[var(--color-primary-soft)] px-4 text-sm font-semibold text-[var(--color-primary-strong)] disabled:opacity-60 sm:w-auto">Save changes</FormSubmitButton>
            </div>
          </form>
        ))}
        {!ministers?.length && <div className="lg:col-span-2"><EmptyState title="No ministers yet" description="Add the first minister to make them available when recording congregation attendance." /></div>}
      </div>
    </div>
  );
}
