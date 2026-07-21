import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { TrendLineChart, type TrendPoint } from "@/components/trend-line-chart";
import { EmptyState, PageHeader } from "@/components/workspace-ui";

export const metadata = { title: "Reports", description: "Church workforce and congregation attendance reporting." };

const serviceTypes = ["Sunday Service", "Tuesday Service", "Special Service", "Headquarters Service", "Tarry Night"];

type ReportRow = {
  id: string;
  roster_count: number;
  present_count: number;
  absent_count: number;
  submitted_at: string;
  departments: { id: string; name: string } | null;
  services: { id: string; service_date: string; service_type: string } | null;
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateRange(days: number) {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - days + 1);
  return { from: isoDate(from), to: isoDate(to) };
}

function percentage(present: number, roster: number) {
  return roster ? Math.min(100, Math.round((present / roster) * 100)) : 0;
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; department?: string; service?: string; range?: string; message?: string; error?: string }>;
}) {
  const { profile } = await requireProfile();
  const params = await searchParams;
  const selectedRange = ["7", "30", "90"].includes(params.range ?? "") ? Number(params.range) : null;
  const fallback = dateRange(selectedRange ?? 90);
  const from = params.from || fallback.from;
  const to = params.to || fallback.to;
  const supabase = await createClient();
  let query = supabase
    .from("attendance_submissions")
    .select("id, roster_count, present_count, absent_count, submitted_at, departments(id, name), services!inner(id, service_date, service_type)")
    .gte("services.service_date", from)
    .lte("services.service_date", to)
    .order("service_date", { referencedTable: "services", ascending: false })
    .limit(1000);

  if (params.department) query = query.eq("department_id", params.department);
  if (params.service && serviceTypes.includes(params.service)) query = query.eq("services.service_type", params.service);

  const [{ data, error }, { data: departments }] = await Promise.all([
    query,
    supabase.from("departments").select("id, name").order("name"),
  ]);
  const rows = (data ?? []) as unknown as ReportRow[];
  const present = rows.reduce((total, row) => total + row.present_count, 0);
  const absent = rows.reduce((total, row) => total + row.absent_count, 0);
  const roster = present + absent;
  const servicesLogged = new Set(rows.map((row) => row.services?.id).filter(Boolean)).size;
  const exportParams = new URLSearchParams({ from, to });
  if (params.department) exportParams.set("department", params.department);
  if (params.service) exportParams.set("service", params.service);
  const quickRangeHref = (days: number) => {
    const queryParams = new URLSearchParams({ range: String(days) });
    if (params.department) queryParams.set("department", params.department);
    if (params.service) queryParams.set("service", params.service);
    return `/app/reports?${queryParams}`;
  };
  const activeFilterCount = Number(Boolean(params.department)) + Number(Boolean(params.service));

  const attendanceByDepartment = [...rows.reduce((groups, row) => {
    const name = row.departments?.name ?? "Unknown department";
    const current = groups.get(name) ?? { present: 0, absent: 0, submissions: 0 };
    current.present += row.present_count;
    current.absent += row.absent_count;
    current.submissions += 1;
    groups.set(name, current);
    return groups;
  }, new Map<string, { present: number; absent: number; submissions: number }>())]
    .map(([name, totals]) => ({ name, ...totals, rate: percentage(totals.present, totals.present + totals.absent) }))
    .sort((a, b) => b.rate - a.rate);

  const headcountByDepartment = attendanceByDepartment
    .map((department) => ({
      name: department.name,
      count: department.present + department.absent,
    }))
    .sort((a, b) => b.count - a.count);
  const maxHeadcount = Math.max(1, ...headcountByDepartment.map((item) => item.count));
  const attendanceByService = [...rows.reduce((groups, row) => {
    if (!row.services) return groups;
    const current = groups.get(row.services.id) ?? {
      date: row.services.service_date,
      type: row.services.service_type,
      present: 0,
      roster: 0,
    };
    current.present += row.present_count;
    current.roster += row.roster_count;
    groups.set(row.services.id, current);
    return groups;
  }, new Map<string, { date: string; type: string; present: number; roster: number }>())]
    .map(([, service]) => service)
    .sort((a, b) => a.date.localeCompare(b.date));
  const trendPoints: TrendPoint[] = attendanceByService.map((service) => ({
    label: new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${service.date}T00:00:00Z`)),
    value: percentage(service.present, service.roster),
    detail: `${service.type} on ${displayDate(service.date)}: ${service.present} of ${service.roster} workers present (${percentage(service.present, service.roster)}%)`,
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <WorkspaceNotice message={params.message} error={params.error ?? error?.message} />
      <PageHeader eyebrow="Church leadership" title={profile.role === "department_head" ? "Worker attendance reports" : "Worker attendance overview"} description="Track church workforce participation across services and departments." actions={<a href={`/api/reports/attendance.csv?${exportParams}`} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(79,125,243,0.2)] hover:bg-[var(--color-primary-strong)] sm:w-auto">Export CSV</a>} />

      <nav aria-label="Report sections" className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <a href="#report-summary" className="flex min-h-11 shrink-0 items-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white">Summary</a>
        <a href="#attendance-trend" className="flex min-h-11 shrink-0 items-center rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]">Attendance trend</a>
        <a href="#department-comparison" className="flex min-h-11 shrink-0 items-center rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]">Departments</a>
        <a href="#service-log" className="flex min-h-11 shrink-0 items-center rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]">Service log</a>
      </nav>

      <section className="mt-5 rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5" aria-labelledby="report-filters-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 id="report-filters-title" className="text-sm font-semibold text-[var(--color-text)]">Report period and filters</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Date shortcuts preserve your department and service selections.</p></div>
          {activeFilterCount > 0 && <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-strong)]">{activeFilterCount} active {activeFilterCount === 1 ? "filter" : "filters"}</span>}
        </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[7, 30, 90].map((days) => (
          <a key={days} href={quickRangeHref(days)} className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-semibold ${selectedRange === days || (!params.from && !selectedRange && days === 90) ? "border-[#4f7df3] bg-[#edf2ff] text-[#4168cd]" : "border-[#dce3f1] bg-white text-[#5e6a81]"}`}>Last {days} days</a>
        ))}
      </div>

      <form className="mt-4 grid gap-3 border-t border-[var(--color-border)] pt-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr_1.2fr_auto_auto]">
        <label className="text-xs font-semibold text-[#68738a]">From<input type="date" name="from" defaultValue={from} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] px-3 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-[#68738a]">To<input type="date" name="to" defaultValue={to} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] px-3 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-[#68738a]">Department<select name="department" defaultValue={params.department ?? ""} disabled={profile.role === "department_head"} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal disabled:bg-[#f4f6fa]"><option value="">All visible</option>{departments?.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-[#68738a]">Service<select name="service" defaultValue={params.service ?? ""} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal"><option value="">All services</option>{serviceTypes.map((service) => <option key={service}>{service}</option>)}</select></label>
        <button className="self-end rounded-xl bg-[#edf2ff] px-5 py-3 text-sm font-semibold text-[#4168cd]">Apply</button>
        <a href="/app/reports" className="self-end rounded-xl border border-[#dce3f1] bg-white px-5 py-3 text-center text-sm font-semibold text-[#68738a]">Clear</a>
      </form>
      <p className="mt-3 text-xs font-medium text-[#8993a7]" aria-live="polite">Showing {displayDate(from)} – {displayDate(to)}</p>
      </section>

      <div id="report-summary" className="mt-6 grid scroll-mt-24 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Worker records", roster, "Expected attendance marks in this period"],
          ["Average present", servicesLogged ? Math.round(present / servicesLogged) : 0, "Workers present per service"],
          ["Services logged", servicesLogged, `${rows.length} department submissions`],
          ["Attendance rate", `${percentage(present, roster)}%`, `${present} of ${roster} records`],
        ].map(([label, value, detail]) => <section key={label} className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]"><p className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</p><p className="mt-2 text-3xl font-semibold text-[var(--color-text)]">{value}</p><p className="mt-2 text-xs text-[var(--color-text-muted)]">{detail}</p></section>)}
      </div>

      <section id="attendance-trend" className="mt-6 scroll-mt-24 rounded-3xl border border-[#e0e6f2] bg-white p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Worker attendance trend</h2>
          <p className="mt-1 text-xs text-[#8993a7]">Attendance rate by service for the active filters above.</p>
        </div>
        <div className="mt-5">
          <TrendLineChart points={trendPoints} title="Worker attendance rate trend" suffix="%" fixedMaximum={100} />
        </div>
      </section>

      <div id="department-comparison" className="mt-6 grid scroll-mt-24 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-[#e0e1e5] bg-white p-5 sm:p-6">
          <h2 className="font-semibold">Headcount by department</h2>
          <div className="mt-5 space-y-4">
            {headcountByDepartment.length ? headcountByDepartment.map((department) => <div key={department.name} className="grid grid-cols-[100px_1fr_auto] items-center gap-3"><p className="truncate text-xs font-medium text-[#555b68]">{department.name}</p><div className="h-2.5 overflow-hidden rounded-full bg-[#f0eee5]"><div className="h-full rounded-full bg-[#d0a820]" style={{ width: `${Math.max(5, (department.count / maxHeadcount) * 100)}%` }} /></div><p className="text-xs font-semibold text-[#555b68]">{department.count}</p></div>) : <p className="py-8 text-sm text-[#8993a7]">No attendance in this period.</p>}
          </div>
        </section>

        <section className="rounded-3xl border border-[#e0e1e5] bg-white p-5 sm:p-6">
          <h2 className="font-semibold">Attendance rate by department</h2>
          <div className="mt-4 space-y-2">
            {attendanceByDepartment.length ? attendanceByDepartment.map((department) => <div key={department.name} className="flex items-center justify-between rounded-xl bg-[#f5f4ee] px-3 py-2"><p className="truncate text-xs font-semibold text-[#4e535d]">{department.name}</p><span className={`text-xs font-semibold ${department.rate >= 75 ? "text-[#32845d]" : department.rate >= 50 ? "text-[#a87516]" : "text-[#b5524b]"}`}>{department.rate}%</span></div>) : <p className="py-8 text-sm text-[#8993a7]">No attendance in this period.</p>}
          </div>
        </section>
      </div>

      <section id="service-log" className="mt-6 scroll-mt-24 overflow-hidden rounded-3xl border border-[#e0e1e5] bg-white">
        <div className="border-b border-[#e8ecf4] px-5 py-4 sm:px-6"><h2 className="font-semibold">Service log</h2></div>
        {rows.length ? <div className="divide-y divide-[#edf0f6]">{rows.slice(0, 100).map((row) => {
          const rate = percentage(row.present_count, row.roster_count);
          const rateStyle = rate >= 80
            ? "border-[#b9dfc8] bg-[#edf8f1] text-[#2f7b50]"
            : rate >= 60
              ? "border-[#ead18b] bg-[#fff8df] text-[#9a6a0a]"
              : "border-[#efc1bd] bg-[#fff1f0] text-[#b5524b]";
          return (
            <div key={row.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
              <div>
                <p className="text-sm font-semibold text-[#34415f]">{row.departments?.name ?? "Department"} · {row.services ? displayDate(row.services.service_date) : "Unknown date"}</p>
                <p className="mt-1 text-xs text-[#8993a7]">Submitted {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.submitted_at))}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#596274]">
                  <span>{row.present_count} of {row.roster_count} workers</span>
                  <span className={`rounded-full border px-2.5 py-1 font-semibold ${rateStyle}`}>{rate}% attendance rate</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#f6f0db] px-3 py-1 text-xs font-medium text-[#7e681c]">{row.services?.service_type ?? "Service"}</span>
                <span className="min-w-8 text-right text-sm font-semibold">{row.present_count}</span>
              </div>
            </div>
          );
        })}</div> : <div className="p-5"><EmptyState title="No worker attendance found" description="No service activity matches the selected date, department and service filters." /></div>}
      </section>
    </div>
  );
}
