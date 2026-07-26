import { FormSubmitButton } from "@/components/form-submit-button";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { PageHeader, StatusBadge } from "@/components/workspace-ui";
import { requireWorkspaceOwner } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { createBranchWorkspace, createChurchWorkspace } from "./actions";

export const metadata = {
  title: "Workspace owner console",
  description: "Manage churches, HQ branches, and branch onboarding across the platform.",
};

type ChurchRow = {
  id: string;
  legal_name: string;
  display_name: string;
  timezone: string;
  status: string;
  created_at: string;
};

type BranchRow = {
  id: string;
  church_id: string;
  name: string;
  code: string;
  is_hq: boolean;
  active: boolean;
  created_at: string;
};

const timezones = [
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Johannesburg",
  "Europe/London",
  "America/New_York",
];

function displayTime(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

export default async function WorkspaceOwnerPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  await requireWorkspaceOwner();
  const params = await searchParams;
  const supabase = await createClient();
  const [churchesResult, branchesResult] = await Promise.all([
    supabase.from("churches").select("id, legal_name, display_name, timezone, status, created_at").order("created_at", { ascending: false }),
    supabase.from("branches").select("id, church_id, name, code, is_hq, active, created_at").order("created_at", { ascending: false }),
  ]);

  const churches = (churchesResult.data ?? []) as ChurchRow[];
  const branches = (branchesResult.data ?? []) as BranchRow[];
  const branchGroups = new Map<string, BranchRow[]>();
  for (const branch of branches) {
    const items = branchGroups.get(branch.church_id) ?? [];
    items.push(branch);
    branchGroups.set(branch.church_id, items);
  }

  const hqCount = branches.filter((branch) => branch.is_hq).length;
  const activeChurchCount = churches.filter((church) => church.status === "active").length;

  return (
    <div className="mx-auto max-w-7xl">
      <WorkspaceNotice message={params.message} error={params.error ?? churchesResult.error?.message ?? branchesResult.error?.message} />
      <PageHeader
        eyebrow="Platform administration"
        title="Workspace owner console"
        description="Create churches, add HQ branches, and prepare new branch sites without touching the church app."
        actions={<StatusBadge tone={churches.length ? "success" : "warning"}>{churches.length ? `${churches.length} churches managed` : "No churches yet"}</StatusBadge>}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
          <p className="text-sm text-[var(--color-text-muted)]">Churches</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{churches.length}</p>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">Tenants registered in the platform</p>
        </section>
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
          <p className="text-sm text-[var(--color-text-muted)]">Branches</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{branches.length}</p>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">HQ and satellite branches combined</p>
        </section>
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
          <p className="text-sm text-[var(--color-text-muted)]">HQ branches</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{hqCount}</p>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">One HQ per church</p>
        </section>
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
          <p className="text-sm text-[var(--color-text-muted)]">Active churches</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{activeChurchCount}</p>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">Ready for new branch setup</p>
        </section>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">Tenant setup</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Create a new church</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">This creates the church record, HQ branch, and default scoped settings together in one transaction.</p>
          </div>

          <form action={createChurchWorkspace} className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--color-text-secondary)] sm:col-span-2">
              Legal name
              <input name="legal_name" required minLength={2} maxLength={160} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" />
            </label>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)] sm:col-span-2">
              Display name
              <input name="display_name" minLength={2} maxLength={160} placeholder="Flock Church" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" />
            </label>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)] sm:col-span-2">
              Timezone
              <select name="timezone" defaultValue="Africa/Lagos" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal">
                {timezones.map((timezone) => <option key={timezone}>{timezone}</option>)}
              </select>
            </label>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <FormSubmitButton pendingLabel="Creating church..." className="min-h-12 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Create church</FormSubmitButton>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">Platform scope</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">What this console controls</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--color-text-secondary)]">
            <li>Create new churches with HQ branches and default settings.</li>
            <li>Add new branches to any active church.</li>
            <li>Review all tenant records from one SaaS-owner workspace.</li>
          </ul>
          <p className="mt-4 rounded-2xl bg-[var(--color-surface-subtle)] px-4 py-3 text-xs leading-5 text-[var(--color-text-muted)]">This page is separate from the church HQ workspace and is intended for the platform owner only.</p>
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">Registered tenants</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Church inventory</h2>
          </div>
          <StatusBadge tone={churches.length ? "success" : "warning"}>{churches.length ? "Managed" : "Empty"}</StatusBadge>
        </div>

        <div className="mt-5 space-y-4">
          {churches.length ? churches.map((church) => {
            const churchBranches = branchGroups.get(church.id) ?? [];
            return (
              <article key={church.id} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-[var(--color-text)]">{church.display_name}</h3>
                      <StatusBadge tone={church.status === "active" ? "success" : "warning"}>{church.status}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{church.legal_name}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{church.timezone} · Created {displayTime(church.created_at)}</p>
                  </div>

                  <form action={createBranchWorkspace} className="grid gap-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-sm)] sm:grid-cols-2 lg:min-w-[420px]">
                    <input type="hidden" name="church_id" value={church.id} />
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] sm:col-span-2">
                      New branch name
                      <input name="name" required minLength={2} maxLength={160} placeholder="Branch name" className="mt-1 h-11 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm font-normal outline-none focus:border-[var(--color-primary)]" />
                    </label>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      Branch code
                      <input name="code" required minLength={2} maxLength={40} placeholder="BR-01" className="mt-1 h-11 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm font-normal outline-none focus:border-[var(--color-primary)]" />
                    </label>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      Timezone
                      <select name="timezone" defaultValue={church.timezone} className="mt-1 h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal">
                        {timezones.map((timezone) => <option key={timezone}>{timezone}</option>)}
                      </select>
                    </label>
                    <div className="sm:col-span-2">
                      <FormSubmitButton pendingLabel="Creating branch..." className="min-h-11 rounded-xl bg-[var(--color-primary-soft)] px-4 text-sm font-semibold text-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-50">Add branch</FormSubmitButton>
                    </div>
                  </form>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {churchBranches.length ? churchBranches.map((branch) => (
                    <div key={branch.id} className="rounded-2xl border border-white bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-[var(--color-text)]">{branch.name}</p>
                        <StatusBadge tone={branch.active ? "success" : "warning"}>{branch.is_hq ? "HQ" : branch.code}</StatusBadge>
                      </div>
                      <p className="mt-2 text-xs text-[var(--color-text-muted)]">{branch.active ? "Active branch" : "Inactive branch"}</p>
                    </div>
                  )) : <p className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-text-muted)]">No branches have been added yet.</p>}
                </div>
              </article>
            );
          }) : <p className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-6 text-sm text-[var(--color-text-muted)]">No churches are registered yet. Use the form above to create the first tenant.</p>}
        </div>
      </section>
    </div>
  );
}
