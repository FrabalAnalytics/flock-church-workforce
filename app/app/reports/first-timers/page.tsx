import Link from "next/link";
import { redirect } from "next/navigation";
import { TrendLineChart } from "@/components/trend-line-chart";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { EmptyState, PageHeader, StatusBadge } from "@/components/workspace-ui";
import { defaultFirstTimerReportPeriod, validateFirstTimerReportFilters } from "@/lib/first-timer-analytics";
import { loadFirstTimerMovementReport } from "@/lib/first-timer-report-server";
import { requireProfile } from "@/lib/auth";

export const metadata = { title: "First-timer movement", description: "Leadership analysis of first-timer movement, training and membership conversion." };

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export default async function FirstTimerMovementReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; coordinator?: string }>;
}) {
  const { profile } = await requireProfile();
  if (!["super_admin", "church_leader"].includes(profile.role)) redirect("/app");
  const params = await searchParams;
  const validated = validateFirstTimerReportFilters(params);
  const filters = typeof validated === "string" ? { ...defaultFirstTimerReportPeriod(), coordinator: null } : validated;
  const report = await loadFirstTimerMovementReport(filters);
  const { analytics } = report;
  const exportParams = new URLSearchParams({ from: filters.from, to: filters.to });
  if (filters.coordinator) exportParams.set("coordinator", filters.coordinator);
  const maxStageCount = Math.max(1, ...analytics.stageDistribution.map((stage) => stage.count));

  return (
    <div className="mx-auto max-w-7xl">
      <WorkspaceNotice error={typeof validated === "string" ? validated : report.error?.message} />
      <Link href="/app/reports" className="mb-5 inline-flex min-h-10 items-center text-sm font-semibold text-[var(--color-primary)]">← Back to reports</Link>
      <PageHeader
        eyebrow="Church leadership"
        title="First-timer movement analysis"
        description="Follow each first-visit cohort through return visits, connection, membership training and final membership."
        actions={<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><a href={`/api/reports/first-timers.csv?${exportParams}`} className="flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-5 text-sm font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-sm)]">Export CSV</a><a href={`/api/reports/first-timers.pdf?${exportParams}`} className="flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)]">Download PDF</a></div>}
      />

      <section className="mt-6 rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
        <div><h2 className="text-sm font-semibold">Cohort and coordinator filters</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">The period selects people by their first-visit date; their later progress remains included.</p></div>
        <form className="mt-4 grid gap-3 border-t border-[var(--color-border)] pt-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_auto_auto] lg:items-end">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">First visit from<input type="date" name="from" defaultValue={filters.from} className="mt-2 h-11 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">First visit to<input type="date" name="to" defaultValue={filters.to} className="mt-2 h-11 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Coordinator<select name="coordinator" defaultValue={filters.coordinator ?? ""} className="mt-2 h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal"><option value="">All coordinators</option><option value="unassigned">Unassigned</option>{report.coordinators.map((coordinator) => <option key={coordinator.id} value={coordinator.id}>{coordinator.name}</option>)}</select></label>
          <button className="min-h-11 rounded-xl bg-[var(--color-primary-soft)] px-5 text-sm font-semibold text-[var(--color-primary-strong)]">Apply</button>
          <Link href="/app/reports/first-timers" className="flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-border)] px-5 text-sm font-semibold text-[var(--color-text-secondary)]">Clear</Link>
        </form>
        <p className="mt-3 text-xs font-medium text-[var(--color-text-muted)]">Cohort: {displayDate(filters.from)} – {displayDate(filters.to)}</p>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["First timers", analytics.total, "Registered in this first-visit cohort"],
          ["Return rate", `${analytics.returnRate}%`, `${analytics.returned} recorded a return journey`],
          ["Member conversion", `${analytics.memberConversionRate}%`, `${analytics.members} completed the journey`],
          ["Training completion", `${analytics.trainingCompletionRate}%`, "Of people who started membership training"],
        ].map(([label, value, detail]) => <section key={label} className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]"><p className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p><p className="mt-2 text-xs text-[var(--color-text-muted)]">{detail}</p></section>)}
      </div>

      <section className="mt-6 rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6">
        <div><h2 className="text-lg font-semibold">Journey conversion funnel</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Percentage of the selected first-visit cohort reaching each milestone.</p></div>
        {analytics.total ? <div className="mt-6 space-y-4">{analytics.funnel.map((step) => <div key={step.key} className="grid gap-2 sm:grid-cols-[150px_1fr_84px] sm:items-center"><p className="text-sm font-semibold text-[var(--color-text-secondary)]">{step.label}</p><div className="h-9 overflow-hidden rounded-xl bg-[var(--color-surface-subtle)]"><div className="flex h-full min-w-12 items-center rounded-xl bg-gradient-to-r from-[#779cf7] to-[#4f7df3] px-3 text-xs font-semibold text-white" style={{ width: `${Math.max(4, step.rate)}%` }}>{step.count}</div></div><p className="text-right text-sm font-semibold">{step.rate}%</p></div>)}</div> : <EmptyState title="No first timers in this cohort" description="Choose a different first-visit period or coordinator." />}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6"><h2 className="text-lg font-semibold">First-visit trend</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Monthly registrations within the selected cohort.</p><div className="mt-5"><TrendLineChart points={analytics.registrationTrend} title="Monthly first-timer registrations" /></div></section>
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6"><h2 className="text-lg font-semibold">Current stage distribution</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Where the selected cohort is now.</p><div className="mt-6 space-y-4">{analytics.stageDistribution.length ? analytics.stageDistribution.map((stage) => <div key={stage.stage}><div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-[var(--color-text-secondary)]">{stage.label}</span><strong>{stage.count}</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"><div className="h-full rounded-full bg-[#6f91e8]" style={{ width: `${Math.max(5, (stage.count / maxStageCount) * 100)}%` }} /></div></div>) : <p className="py-8 text-sm text-[var(--color-text-muted)]">No stages to display.</p>}</div></section>
      </div>

      <section className="mt-6 rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6">
        <h2 className="text-lg font-semibold">Average movement time</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Calendar days from first visit to each recorded milestone.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">{[
          ["Return visit", analytics.averageDaysToReturn],
          ["Training started", analytics.averageDaysToTraining],
          ["Membership", analytics.averageDaysToMembership],
        ].map(([label, days]) => <div key={label} className="rounded-2xl bg-[var(--color-surface-subtle)] p-4"><p className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</p><p className="mt-2 text-2xl font-semibold">{days === null ? "—" : `${days} days`}</p></div>)}</div>
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-border)] px-5 py-4 sm:px-6"><h2 className="text-lg font-semibold">Coordinator movement overview</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Workload, overdue actions and membership outcomes for this cohort.</p></div>
        {analytics.coordinatorPerformance.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-[var(--color-surface-subtle)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]"><tr><th className="px-5 py-3 sm:px-6">Coordinator</th><th className="px-4 py-3 text-right">Journeys</th><th className="px-4 py-3 text-right">Active</th><th className="px-4 py-3 text-right">Overdue</th><th className="px-4 py-3 text-right">Members</th><th className="px-5 py-3 text-right sm:px-6">Conversion</th></tr></thead><tbody className="divide-y divide-[var(--color-border)]">{analytics.coordinatorPerformance.map((row) => <tr key={row.coordinatorId}><td className="px-5 py-4 font-semibold sm:px-6">{row.coordinator}</td><td className="px-4 py-4 text-right">{row.journeys}</td><td className="px-4 py-4 text-right">{row.active}</td><td className="px-4 py-4 text-right"><span className={row.overdue ? "font-semibold text-[var(--color-danger)]" : ""}>{row.overdue}</span></td><td className="px-4 py-4 text-right">{row.members}</td><td className="px-5 py-4 text-right font-semibold sm:px-6">{row.conversionRate}%</td></tr>)}</tbody></table></div> : <div className="p-5"><EmptyState title="No coordinator activity" description="There are no first-timer journeys in this cohort." /></div>}
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:px-6"><div><h2 className="text-lg font-semibold">Journeys needing leadership attention</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Overdue follow-up or at least 30 days without a stage change.</p></div><StatusBadge tone={analytics.stalled.length ? "warning" : "success"}>{analytics.stalled.length} stalled</StatusBadge></div>
        {analytics.stalled.length ? <div className="divide-y divide-[var(--color-border)]">{analytics.stalled.slice(0, 100).map((person) => <article key={person.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6"><div><Link href={`/app/first-timers/${person.id}`} className="text-sm font-semibold text-[var(--color-primary-strong)] hover:underline">{person.fullName}</Link><p className="mt-1 text-xs text-[var(--color-text-muted)]">{person.stageLabel} · {person.coordinator} · {person.daysInStage} days in stage</p></div>{person.overdue ? <StatusBadge tone="danger">Follow-up overdue</StatusBadge> : <StatusBadge tone="warning">No stage movement</StatusBadge>}</article>)}</div> : <div className="p-5"><EmptyState title="No stalled journeys" description="No active journey currently meets the attention threshold." /></div>}
      </section>
    </div>
  );
}
