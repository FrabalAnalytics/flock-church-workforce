import Link from "next/link";
import { DeleteUserAccountForm } from "@/components/delete-user-account-form";
import { InviteUserForm } from "@/components/invite-user-form";
import { UserAccessForm } from "@/components/user-access-form";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { EmptyState, MetricPill, PageHeader, StatusBadge } from "@/components/workspace-ui";

export const metadata = { title: "User access", description: "Manage Flock user roles and department access." };
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

const labels = { pending: "Pending", super_admin: "Super Admin", church_leader: "Church Leader", department_head: "Department Head", first_timer_coordinator: "First Timers Coordinator" };

type UserSearchParams = { message?: string; error?: string; q?: string; role?: string; department?: string };

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<UserSearchParams> }) {
  const { user: currentUser } = await requireSuperAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: allUsers }, { data: departments }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, phone_number, role, department_id, created_at").order("created_at", { ascending: false }),
    supabase.from("departments").select("id, name").order("name"),
  ]);

  const pendingCount = allUsers?.filter((user) => user.role === "pending").length ?? 0;
  const departmentHeadCount = allUsers?.filter((user) => user.role === "department_head").length ?? 0;
  const leaderCount = allUsers?.filter((user) => user.role === "church_leader" || user.role === "super_admin").length ?? 0;
  const departmentNames = new Map(departments?.map((department) => [department.id, department.name]));
  const normalizedSearch = params.q?.trim().toLowerCase();
  const users = allUsers?.filter((user) => {
    const matchesSearch = !normalizedSearch || user.full_name.toLowerCase().includes(normalizedSearch) || user.email?.toLowerCase().includes(normalizedSearch);
    const matchesRole = !params.role || user.role === params.role;
    const matchesDepartment = !params.department || user.department_id === params.department;
    return matchesSearch && matchesRole && matchesDepartment;
  });
  const hasFilters = Boolean(params.q || params.role || params.department);
  const returnParams = new URLSearchParams();
  if (params.q) returnParams.set("q", params.q);
  if (params.role && params.role in labels) returnParams.set("role", params.role);
  if (params.department && departmentNames.has(params.department)) returnParams.set("department", params.department);
  const returnTo = `/app/users${returnParams.size ? `?${returnParams}` : ""}`;

  return (
    <div className="mx-auto max-w-7xl">
      <WorkspaceNotice message={params.message} error={params.error} />
      <PageHeader
        eyebrow="Access control"
        title="Users"
        description="Approve accounts and manage each person's workspace role and department access."
        actions={<MetricPill value={pendingCount} label="pending approval" tone={pendingCount ? "warning" : "neutral"} />}
      />

      <div className="mt-6 flex flex-wrap gap-2" aria-label="User access summary">
        <MetricPill value={allUsers?.length ?? 0} label="total accounts" />
        <MetricPill value={leaderCount} label="church leaders and admins" />
        <MetricPill value={departmentHeadCount} label="department heads" />
        {pendingCount > 0 && <Link href="/app/users?role=pending" className="inline-flex"><MetricPill value={pendingCount} label="needs review" tone="warning" /></Link>}
      </div>

      <div className="mt-7 rounded-2xl border border-[#d9e3fb] bg-[#f4f7ff] px-4 py-3.5 text-sm leading-6 text-[#49608f]">
        <strong className="font-semibold text-[#304d91]">Protected identity records.</strong> Church Leaders and Department Heads cannot change their own profile details; changes made here apply to their next authenticated request.
      </div>

      <InviteUserForm departments={departments ?? []} />

      <form className="mt-5 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_200px_220px_auto_auto] xl:items-end">
          <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Search users<input name="q" defaultValue={params.q} placeholder="Name or email address" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
          <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Role<select name="role" defaultValue={params.role ?? ""} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal"><option value="">All roles</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Department<select name="department" defaultValue={params.department ?? ""} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal"><option value="">All departments</option>{departments?.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
          <button className="min-h-12 rounded-xl bg-[var(--color-primary-soft)] px-5 text-sm font-semibold text-[var(--color-primary-strong)] hover:bg-[#dfe8ff]">Apply filters</button>
          {hasFilters && <Link href="/app/users" className="flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-border)] px-5 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]">Clear</Link>}
        </div>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--color-text-secondary)]"><strong className="text-[var(--color-text)]">{users?.length ?? 0}</strong> user{users?.length === 1 ? "" : "s"} found</p>
        {hasFilters && <StatusBadge tone="info">Filtered view</StatusBadge>}
      </div>

      <div className="mt-3 space-y-4">
        {users?.length ? users.map((user) => (
          <article key={user.id} className={`rounded-3xl border bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6 ${user.role === "pending" ? "border-[#efd7a9]" : "border-[var(--color-border)]"}`}>
            <div className="grid gap-6 xl:grid-cols-[minmax(260px,0.8fr)_minmax(460px,1.2fr)] xl:items-center">
              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary)]">{initials(user.full_name)}</span>
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold text-[#253252]">{user.full_name}</h2>{user.id === currentUser.id && <StatusBadge tone="info">You</StatusBadge>}</div><p className="mt-1 truncate text-sm text-[var(--color-text-muted)]">{user.email ?? "Email unavailable"}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">{user.phone_number ?? "No phone number"}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">Joined {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(user.created_at))}</p></div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StatusBadge tone={user.role === "pending" ? "warning" : user.role === "super_admin" ? "info" : "success"}>{labels[user.role as keyof typeof labels]}</StatusBadge>
                  {user.department_id && <StatusBadge>{departmentNames.get(user.department_id) ?? "Unknown department"}</StatusBadge>}
                </div>
              </div>

              <div>
                <UserAccessForm id={user.id} fullName={user.full_name} initialRole={user.role as keyof typeof labels} initialDepartmentId={user.department_id} departments={departments ?? []} isCurrentUser={user.id === currentUser.id} returnTo={returnTo} />
                {user.id !== currentUser.id && (["church_leader", "first_timer_coordinator", "super_admin"].includes(user.role)) && (
                  <DeleteUserAccountForm id={user.id} fullName={user.full_name} roleLabel={labels[user.role as keyof typeof labels]} returnTo={returnTo} />
                )}
              </div>
            </div>
          </article>
        )) : <EmptyState title="No users found" description="No user accounts match the selected search and filters." action={hasFilters ? <Link href="/app/users" className="inline-flex min-h-11 items-center rounded-xl bg-[var(--color-primary-soft)] px-5 text-sm font-semibold text-[var(--color-primary-strong)]">Clear filters</Link> : undefined} />}
      </div>
    </div>
  );
}
