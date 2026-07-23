import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { requireProfile, type ProfileRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Department overview", description: "Your department workforce, attendance and care overview." };

type Submission = {
  id: string;
  roster_count: number;
  present_count: number;
  absent_count: number;
  submitted_at: string;
  departments: { name: string } | null;
  services: { service_date: string; service_type: string } | null;
};

type CareAlert = {
  id: string;
  consecutive_misses: number;
  created_at: string;
  workers: { full_name: string; departments: { name: string } | null } | null;
};

type TodayService = {
  id: string;
  service_type: string;
};

type TodaySubmission = {
  id: string;
  service_id: string;
};

const roleEyebrows: Record<ProfileRole, string> = {
  pending: "Account",
  super_admin: "Administration",
  church_leader: "Church oversight",
  department_head: "Department operations",
  first_timer_coordinator: "Newcomer care",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function metric(label: string, value: string | number, detail: string) {
  return { label, value, detail };
}

function lagosDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export default async function WorkspaceOverview({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { profile } = await requireProfile();
  const params = await searchParams;
  const usesLeadershipOverview = ["super_admin", "church_leader"].includes(profile.role);
  if (usesLeadershipOverview) {
    const query = new URLSearchParams();
    if (params.message) query.set("message", params.message);
    if (params.error) query.set("error", params.error);
    redirect(`/app/reports${query.size ? `?${query}` : ""}`);
  }
  if (profile.role === "first_timer_coordinator") {
    redirect("/app/first-timers");
  }
  const supabase = await createClient();
  const today = lagosDate();

  const [
    activeWorkersResult,
    submissionsResult,
    recentSubmissionsResult,
    openFollowupsResult,
    recentAlertsResult,
    todayServicesResult,
    todaySubmissionsResult,
    departmentsResult,
    pendingResult,
  ] = await Promise.all([
    supabase.from("workers").select("*", { count: "exact", head: true }).eq("status", "Active"),
    supabase
      .from("attendance_submissions")
      .select("id, roster_count, present_count, absent_count, departments(name)")
      .order("submitted_at", { ascending: false })
      .limit(250),
    supabase
      .from("attendance_submissions")
      .select("id, roster_count, present_count, absent_count, submitted_at, departments(name), services(service_date, service_type)")
      .order("submitted_at", { ascending: false })
      .limit(5),
    supabase.from("absence_followups").select("*", { count: "exact", head: true }).eq("resolved", false),
    supabase
      .from("absence_followups")
      .select("id, consecutive_misses, created_at, workers(full_name, departments(name))")
      .eq("resolved", false)
      .order("consecutive_misses", { ascending: false })
      .limit(5),
    supabase.from("services").select("id, service_type").eq("service_date", today).order("service_type"),
    supabase
      .from("attendance_submissions")
      .select("id, service_id, services!inner(service_date)")
      .eq("services.service_date", today),
    profile.role === "super_admin"
      ? supabase.from("departments").select("*", { count: "exact", head: true })
      : Promise.resolve({ count: null }),
    profile.role === "super_admin"
      ? supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "pending")
      : Promise.resolve({ count: null }),
  ]);

  const submissions = submissionsResult.data ?? [];
  const presentTotal = submissions.reduce((total, item) => total + item.present_count, 0);
  const rosterTotal = submissions.reduce((total, item) => total + item.roster_count, 0);
  const attendanceRate = rosterTotal ? Math.round((presentTotal / rosterTotal) * 100) : 0;
  const departmentPerformance = [...submissions.reduce((groups, item) => {
    const department = item.departments as unknown as { name: string } | null;
    const name = department?.name ?? "Unknown department";
    const current = groups.get(name) ?? { present: 0, roster: 0, submissions: 0 };
    current.present += item.present_count;
    current.roster += item.roster_count;
    current.submissions += 1;
    groups.set(name, current);
    return groups;
  }, new Map<string, { present: number; roster: number; submissions: number }>())]
    .map(([name, totals]) => ({
      name,
      rate: totals.roster ? Math.round((totals.present / totals.roster) * 100) : 0,
      submissions: totals.submissions,
    }))
    .sort((a, b) => b.rate - a.rate);
  const recentSubmissions = (recentSubmissionsResult.data ?? []) as unknown as Submission[];
  const recentAlerts = (recentAlertsResult.data ?? []) as unknown as CareAlert[];
  const todayServices = (todayServicesResult.data ?? []) as TodayService[];
  const todaySubmissions = (todaySubmissionsResult.data ?? []) as unknown as TodaySubmission[];
  const completedServiceIds = new Set(todaySubmissions.map((submission) => submission.service_id));
  const outstandingToday = todayServices.filter((service) => !completedServiceIds.has(service.id));
  const todayComplete = todayServices.length > 0 && outstandingToday.length === 0;

  const metrics = [
    metric("Active workers", activeWorkersResult.count ?? 0, profile.role === "department_head" ? "Your department roster" : "Visible workforce"),
    metric("Worker attendance rate", `${attendanceRate}%`, submissions.length ? `Across ${submissions.length} recent submissions` : "No submissions yet"),
    metric("Open care alerts", openFollowupsResult.count ?? 0, "Awaiting follow-up"),
    metric("Submissions", submissions.length, "Up to 250 recent records"),
  ];

  const quickActions = profile.role === "department_head"
    ? [
        { href: "/app/attendance/new", label: "Log worker attendance", primary: true },
        { href: "/app/programmes", label: "View service programme", primary: false },
        { href: "/app/follow-ups", label: "Review follow-ups", primary: false },
      ]
    : profile.role === "super_admin"
      ? [
          { href: "/app/users", label: `Review users${pendingResult.count ? ` (${pendingResult.count})` : ""}`, primary: true },
          { href: "/app/workers/new", label: "Add worker", primary: false },
        ]
      : [
          { href: "/app/attendance", label: "Review worker attendance", primary: true },
          { href: "/app/follow-ups", label: "Review care alerts", primary: false },
        ];

  const errors = [
    activeWorkersResult.error,
    submissionsResult.error,
    recentSubmissionsResult.error,
    openFollowupsResult.error,
    recentAlertsResult.error,
    todayServicesResult.error,
    todaySubmissionsResult.error,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl">
      <WorkspaceNotice message={params.message} error={params.error ?? errors[0]?.message} />
      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#4f7df3]">{roleEyebrows[profile.role]}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Welcome, {profile.full_name.split(" ")[0]}</h1>
      <p className="mt-2 text-sm text-[#758097]">
        {profile.role === "department_head"
          ? "Keep your department attendance and care follow-up current."
          : "Monitor workforce participation and care activity across the records you can access."}
      </p>

      {profile.role === "department_head" && (
        <section className={`mt-8 overflow-hidden rounded-3xl border ${todayComplete ? "border-[#cfe3d5] bg-[#f4faf6]" : outstandingToday.length ? "border-[#efd8a8] bg-[#fffaf0]" : "border-[#dbe3f2] bg-white"}`} aria-labelledby="today-attendance-title">
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Today · {formatDate(today)}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${todayComplete ? "bg-[#e3f2e8] text-[#347457]" : outstandingToday.length ? "bg-[#fff0cf] text-[#976619]" : "bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]"}`}>{todayComplete ? "Attendance complete" : outstandingToday.length ? `${outstandingToday.length} outstanding` : "No service yet"}</span>
              </div>
              <h2 id="today-attendance-title" className="mt-3 text-xl font-semibold text-[var(--color-text)]">{todayComplete ? "Your department is up to date" : outstandingToday.length ? "Worker attendance needs attention" : "Ready for today’s service"}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">{todayComplete ? `Attendance has been submitted for ${todayServices.length === 1 ? "today’s service" : `all ${todayServices.length} services recorded today`}.` : outstandingToday.length ? `${todaySubmissions.length} of ${todayServices.length} recorded ${todayServices.length === 1 ? "service has" : "services have"} attendance from your department.` : "No service activity has been recorded today. Start attendance when your department is ready."}</p>
              {todayServices.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{todayServices.map((service) => { const complete = completedServiceIds.has(service.id); return <span key={service.id} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${complete ? "bg-white text-[#347457]" : "bg-white text-[#976619]"}`}>{complete ? "✓" : "○"} {service.service_type}</span>; })}</div>}
            </div>
            <Link href={todayComplete ? `/app/attendance?from=${today}&to=${today}` : "/app/attendance/new"} className={`flex min-h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-semibold shadow-[var(--shadow-sm)] lg:w-auto ${todayComplete ? "border border-[#cfe3d5] bg-white text-[#347457]" : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-strong)]"}`}>{todayComplete ? "Review today’s records" : "Log worker attendance"}</Link>
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <section key={item.label} className="rounded-3xl border border-[#e0e6f2] bg-white p-6">
            <p className="text-sm text-[#7b8599]">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#172344]">{item.value}</p>
            <p className="mt-2 text-xs text-[#929bad]">{item.detail}</p>
          </section>
        ))}
      </div>

      {profile.role === "super_admin" && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#68738a]">
          <span className="rounded-full bg-[#edf2ff] px-3 py-1.5">{departmentsResult.count ?? 0} departments</span>
          <span className="rounded-full bg-[#fff3dc] px-3 py-1.5 text-[#a76813]">{pendingResult.count ?? 0} pending users</span>
        </div>
      )}

      {profile.role !== "department_head" && (
        <section className="mt-8 rounded-3xl border border-[#e0e6f2] bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Department performance</h2>
              <p className="mt-1 text-xs text-[#8993a7]">Attendance rate across the visible submission history</p>
            </div>
            <Link href="/app/reports" className="text-sm font-semibold text-[#4f7df3]">Open reports</Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {departmentPerformance.length ? departmentPerformance.map((department) => (
              <div key={department.name} className="rounded-2xl bg-[#f7f9fd] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-[#34415f]">{department.name}</p>
                  <span className="text-sm font-semibold text-[#4f7df3]">{department.rate}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e2e8f5]">
                  <div className="h-full rounded-full bg-[#4f7df3]" style={{ width: `${department.rate}%` }} />
                </div>
                <p className="mt-2 text-xs text-[#929bad]">{department.submissions} submissions</p>
              </div>
            )) : <p className="py-6 text-sm text-[#8993a7]">Department comparisons will appear after attendance is submitted.</p>}
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-[#e0e6f2] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Recent worker attendance</h2>
              <p className="mt-1 text-xs text-[#8993a7]">Latest department submissions</p>
            </div>
            <Link href="/app/attendance" className="text-sm font-semibold text-[#4f7df3]">View all</Link>
          </div>
          <div className="mt-5 divide-y divide-[#edf0f6]">
            {recentSubmissions.length ? recentSubmissions.map((submission) => (
              <div key={submission.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-[#34415f]">{submission.services?.service_type ?? "Service"}</p>
                  <p className="mt-1 text-xs text-[#8993a7]">
                    {submission.services?.service_date ? formatDate(submission.services.service_date) : "Unknown date"} · {submission.departments?.name ?? "Department"}
                  </p>
                </div>
                <div className="flex gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-[#edf7f1] px-3 py-1 text-[#347457]">{submission.present_count} present</span>
                  <span className="rounded-full bg-[#fff1f0] px-3 py-1 text-[#b5524b]">{submission.absent_count} absent</span>
                </div>
              </div>
            )) : <p className="py-10 text-center text-sm text-[#8993a7]">No worker attendance submissions yet.</p>}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl bg-[#4f7df3] p-6 text-white">
            <h2 className="text-xl font-semibold">Next actions</h2>
            <p className="mt-2 text-sm leading-6 text-white/75">Keep today’s workforce records and care responsibilities moving.</p>
            <div className="mt-5 space-y-2">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href} className={`block rounded-xl px-4 py-3 text-center text-sm font-semibold ${action.primary ? "bg-white text-[#3f68d1]" : "border border-white/30 text-white"}`}>{action.label}</Link>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#e0e6f2] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Priority care</h2>
              <Link href="/app/follow-ups" className="text-sm font-semibold text-[#4f7df3]">View all</Link>
            </div>
            <div className="mt-4 divide-y divide-[#edf0f6]">
              {recentAlerts.length ? recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#34415f]">{alert.workers?.full_name ?? "Unknown worker"}</p>
                    <p className="mt-1 truncate text-xs text-[#8993a7]">{alert.workers?.departments?.name ?? "Department"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${alert.consecutive_misses >= 4 ? "bg-[#fff1f0] text-[#b5524b]" : "bg-[#fff3dc] text-[#a76813]"}`}>{alert.consecutive_misses} misses</span>
                </div>
              )) : <p className="py-7 text-center text-sm text-[#8993a7]">No open care alerts.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
