import Link from "next/link";
import { createMinister, updateMinister } from "@/app/app/admin/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { EmptyState, MetricPill, PageHeader, StatusBadge } from "@/components/workspace-ui";
import { requireSuperAdmin } from "@/lib/admin";

export const metadata = { title: "Minister directory", description: "Manage minister names used in congregation attendance records." };
import { createClient } from "@/lib/supabase/server";

export default async function MinistersPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string; q?: string; status?: string }> }) {
  await requireSuperAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const { data: ministers, error } = await supabase.from("ministers").select("id, title, full_name, active").order("active", { ascending: false }).order("full_name");
  const activeCount = ministers?.filter((minister) => minister.active).length ?? 0;
  const query = params.q?.trim().toLocaleLowerCase() ?? "";
  const status = ["active", "inactive"].includes(params.status ?? "") ? params.status : "all";
  const filteredMinisters = (ministers ?? []).filter((minister) => {
    const matchesQuery = !query || `${minister.title ?? ""} ${minister.full_name}`.toLocaleLowerCase().includes(query);
    const matchesStatus = status === "all" || (status === "active" ? minister.active : !minister.active);
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-7xl">
      <WorkspaceNotice message={params.message} error={params.error ?? error?.message} />
      <PageHeader eyebrow="Service setup" title="Minister directory" description="Keep minister names consistent in congregation-attendance records. Deactivate a minister to preserve history while removing them from future selection." actions={<a href="#add-minister" className="flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] hover:bg-[var(--color-primary-strong)]">Add minister</a>} />
      <div className="mt-5 flex flex-wrap gap-2">
        <MetricPill label="Total ministers" value={ministers?.length ?? 0} />
        <MetricPill label="Available" value={activeCount} />
        <MetricPill label="Inactive" value={(ministers?.length ?? 0) - activeCount} />
      </div>
      <form id="add-minister" action={createMinister} className="mt-8 grid scroll-mt-24 gap-4 rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:grid-cols-[0.55fr_1fr_auto] sm:items-end sm:p-6">
        <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Title <span className="font-normal text-[var(--color-text-muted)]">(optional)</span><input name="title" maxLength={40} placeholder="e.g. Pastor" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
        <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Full name<input name="full_name" minLength={2} maxLength={120} required placeholder="Enter minister's full name" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
        <FormSubmitButton pendingLabel="Adding minister…" className="min-h-12 w-full rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)] disabled:opacity-60 sm:w-auto">Add minister</FormSubmitButton>
      </form>

      <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)]" aria-label="Filter ministers">
        <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
            Search directory
            <span className="relative mt-2 block">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 fill-none stroke-[var(--color-icon-muted)]" strokeWidth="1.8"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
              <input name="q" defaultValue={params.q ?? ""} placeholder="Search by name or title" className="h-12 w-full rounded-xl border border-[var(--color-border)] pl-11 pr-4 text-sm font-normal outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]" />
            </span>
          </label>
          <input type="hidden" name="status" value={status} />
          <button className="min-h-12 rounded-xl bg-[var(--color-primary-soft)] px-5 text-sm font-semibold text-[var(--color-primary-strong)] hover:bg-[#e2eaff]">Search</button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4" aria-label="Minister status">
          {[["all", "All", ministers?.length ?? 0], ["active", "Available", activeCount], ["inactive", "Inactive", (ministers?.length ?? 0) - activeCount]].map(([value, label, count]) => {
            const href = new URLSearchParams();
            if (params.q) href.set("q", params.q);
            if (value !== "all") href.set("status", String(value));
            const active = status === value;
            return <Link key={String(value)} href={`/app/ministers${href.size ? `?${href}` : ""}`} aria-current={active ? "page" : undefined} className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${active ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"}`}>{label} <span className="ml-1 opacity-75">{count}</span></Link>;
          })}
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--color-text-secondary)]"><strong className="font-semibold text-[var(--color-text)]">{filteredMinisters.length}</strong> {filteredMinisters.length === 1 ? "minister" : "ministers"} shown</p>
        {(query || status !== "all") && <Link href="/app/ministers" className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-strong)]">Clear filters</Link>}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {filteredMinisters.map((minister) => (
          <form action={updateMinister} key={minister.id} className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <input type="hidden" name="id" value={minister.id} />
            <div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-sm font-bold text-[var(--color-primary-strong)]">{minister.full_name.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--color-text)]">{minister.title ? `${minister.title} ` : ""}{minister.full_name}</p><p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Minister record</p></div></div><StatusBadge tone={minister.active ? "success" : "neutral"}>{minister.active ? "Active" : "Inactive"}</StatusBadge></div>
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
        {!filteredMinisters.length && <div className="lg:col-span-2"><EmptyState title={ministers?.length ? "No ministers match these filters" : "No ministers yet"} description={ministers?.length ? "Try another name or clear the current status filter." : "Add the first minister to make them available when recording congregation attendance."} action={ministers?.length ? <Link href="/app/ministers" className="font-semibold text-[var(--color-primary)]">Clear filters</Link> : undefined} /></div>}
      </div>
    </div>
  );
}
