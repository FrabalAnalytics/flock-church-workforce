import { redirect } from "next/navigation";
import { correctChurchAttendance, submitChurchAttendance } from "@/app/app/church-attendance/actions";
import { TrendLineChart, type TrendPoint } from "@/components/trend-line-chart";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const serviceTypes = ["Sunday Service", "Tuesday Service", "Special Service", "Headquarters Service", "Tarry Night"];

type ChurchAttendanceRow = {
  id: string;
  adult_male_count: number;
  adult_female_count: number;
  children_count: number;
  new_members_male_count: number;
  new_members_female_count: number;
  new_converts_male_count: number;
  new_converts_female_count: number;
  total_count: number;
  minister_id: string | null;
  service_notes: string | null;
  submitted_at: string;
  updated_at: string;
  services: { id: string; service_date: string; service_type: string } | null;
  ministers: { id: string; title: string | null; full_name: string; active: boolean } | null;
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

function displayDate(value: string, short = false) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: short ? "short" : "long",
    ...(short ? {} : { year: "numeric" as const }),
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

export default async function ChurchAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; service?: string; range?: string; message?: string; error?: string }>;
}) {
  const { profile } = await requireProfile();
  if (profile.role !== "super_admin" && profile.role !== "church_leader") redirect("/app");

  const params = await searchParams;
  const selectedRange = ["7", "30", "90"].includes(params.range ?? "") ? Number(params.range) : null;
  const fallback = dateRange(selectedRange ?? 90);
  const from = params.from || fallback.from;
  const to = params.to || fallback.to;
  const supabase = await createClient();
  const { data: ministers } = await supabase
    .from("ministers")
    .select("id, title, full_name, active")
    .order("active", { ascending: false })
    .order("full_name");
  const activeMinisters = (ministers ?? []).filter((minister) => minister.active);
  let query = supabase
    .from("church_attendance")
    .select("id, minister_id, service_notes, adult_male_count, adult_female_count, children_count, new_members_male_count, new_members_female_count, new_converts_male_count, new_converts_female_count, total_count, submitted_at, updated_at, ministers(id, title, full_name, active), services!inner(id, service_date, service_type)")
    .gte("services.service_date", from)
    .lte("services.service_date", to)
    .order("service_date", { referencedTable: "services", ascending: false })
    .limit(500);
  if (params.service && serviceTypes.includes(params.service)) query = query.eq("services.service_type", params.service);

  const { data, error } = await query;
  const rows = (data ?? []) as unknown as ChurchAttendanceRow[];
  const adultMale = rows.reduce((sum, row) => sum + row.adult_male_count, 0);
  const adultFemale = rows.reduce((sum, row) => sum + row.adult_female_count, 0);
  const children = rows.reduce((sum, row) => sum + row.children_count, 0);
  const newMembersMale = rows.reduce((sum, row) => sum + row.new_members_male_count, 0);
  const newMembersFemale = rows.reduce((sum, row) => sum + row.new_members_female_count, 0);
  const newConvertsMale = rows.reduce((sum, row) => sum + row.new_converts_male_count, 0);
  const newConvertsFemale = rows.reduce((sum, row) => sum + row.new_converts_female_count, 0);
  const newMembers = newMembersMale + newMembersFemale;
  const newConverts = newConvertsMale + newConvertsFemale;
  const total = adultMale + adultFemale + children;
  const average = rows.length ? Math.round(total / rows.length) : 0;
  const trendPoints: TrendPoint[] = [...rows].reverse().map((row) => ({
    label: row.services ? displayDate(row.services.service_date, true) : "Service",
    value: row.total_count,
    detail: `${row.services?.service_type ?? "Service"} on ${row.services ? displayDate(row.services.service_date) : "unknown date"}: ${row.total_count} attendees`,
  }));
  const newMemberTrendPoints: TrendPoint[] = [...rows].reverse().map((row) => ({
    label: row.services ? displayDate(row.services.service_date, true) : "Service",
    value: row.new_members_male_count + row.new_members_female_count,
    detail: `${row.services?.service_type ?? "Service"}: ${row.new_members_male_count + row.new_members_female_count} new members`,
  }));
  const newConvertTrendPoints: TrendPoint[] = [...rows].reverse().map((row) => ({
    label: row.services ? displayDate(row.services.service_date, true) : "Service",
    value: row.new_converts_male_count + row.new_converts_female_count,
    detail: `${row.services?.service_type ?? "Service"}: ${row.new_converts_male_count + row.new_converts_female_count} new converts`,
  }));
  const byServiceType = [...rows.reduce((groups, row) => {
    const name = row.services?.service_type ?? "Unknown service";
    groups.set(name, (groups.get(name) ?? 0) + row.total_count);
    return groups;
  }, new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  const exportParams = new URLSearchParams({ from, to });
  if (params.service) exportParams.set("service", params.service);

  return (
    <div className="mx-auto max-w-6xl">
      <WorkspaceNotice message={params.message} error={params.error ?? error?.message} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#4f7df3]">Congregation</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Congregation attendance</h1>
          <p className="mt-2 text-sm text-[#758097]">Monitor aggregate congregation totals without collecting attendee identities.</p>
        </div>
        <a href={`/api/reports/church-attendance.csv?${exportParams}`} className="w-fit rounded-xl border border-[#dce3f1] bg-white px-5 py-3 text-sm font-semibold text-[#536078]">Export CSV</a>
      </div>

      {profile.role === "super_admin" ? <section className="mt-7 rounded-3xl border border-[#dbe3f2] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-lg font-semibold">Record a service</h2><p className="mt-1 text-xs text-[#8993a7]">Only one church-attendance record is allowed for each calendar date.</p></div>
          <span className="w-fit rounded-full bg-[#edf8f1] px-3 py-1 text-xs font-semibold text-[#2f7b50]">Aggregate counts only</span>
        </div>
        <form action={submitChurchAttendance} className="mt-5">
          {!activeMinisters.length && <div className="mb-5 rounded-2xl border border-[#f0d9a8] bg-[#fff9ec] px-4 py-3 text-sm text-[#7b5b19]">Add an active minister in the <a href="/app/ministers" className="font-semibold underline">Minister Directory</a> before recording attendance.</div>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-xs font-semibold text-[#68738a]">Service date<input type="date" name="service_date" max={isoDate(new Date())} defaultValue={isoDate(new Date())} required className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] px-3 text-sm font-normal" /></label>
            <label className="text-xs font-semibold text-[#68738a]">Service type<select name="service_type" required className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal">{serviceTypes.map((service) => <option key={service}>{service}</option>)}</select></label>
            <label className="text-xs font-semibold text-[#68738a]">Adult male<input type="number" name="adult_male_count" min="0" step="1" defaultValue="0" required className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] px-3 text-sm font-normal" /></label>
            <label className="text-xs font-semibold text-[#68738a]">Adult female<input type="number" name="adult_female_count" min="0" step="1" defaultValue="0" required className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] px-3 text-sm font-normal" /></label>
            <label className="text-xs font-semibold text-[#68738a]">Children<input type="number" name="children_count" min="0" step="1" defaultValue="0" required className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] px-3 text-sm font-normal" /></label>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
            <label className="text-xs font-semibold text-[#68738a]">Minister for the service<select name="minister_id" required defaultValue="" className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal"><option value="" disabled>Select an active minister</option>{activeMinisters.map((minister) => <option key={minister.id} value={minister.id}>{minister.title ? `${minister.title} ` : ""}{minister.full_name}</option>)}</select></label>
            <label className="text-xs font-semibold text-[#68738a]">Service notes <span className="font-normal text-[#9aa3b5]">(optional)</span><textarea name="service_notes" maxLength={2000} rows={3} placeholder="Key observations, message theme or service context" className="mt-2 w-full resize-y rounded-xl border border-[#dce3f1] px-3 py-3 text-sm font-normal" /></label>
          </div>
          <div className="mt-5 rounded-2xl border border-[#e3e8f2] bg-[#f8faff] p-4">
            <h3 className="text-sm font-semibold text-[#34415f]">First-time response groups</h3>
            <p className="mt-1 text-xs leading-5 text-[#758097]">These people are already included in the adult male and female totals. A person cannot be counted as both a new member and a new convert.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-semibold text-[#68738a]">New members — male<input type="number" name="new_members_male_count" min="0" step="1" defaultValue="0" required className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal" /></label>
              <label className="text-xs font-semibold text-[#68738a]">New members — female<input type="number" name="new_members_female_count" min="0" step="1" defaultValue="0" required className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal" /></label>
              <label className="text-xs font-semibold text-[#68738a]">New converts — male<input type="number" name="new_converts_male_count" min="0" step="1" defaultValue="0" required className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal" /></label>
              <label className="text-xs font-semibold text-[#68738a]">New converts — female<input type="number" name="new_converts_female_count" min="0" step="1" defaultValue="0" required className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal" /></label>
            </div>
          </div>
          <div className="mt-5 flex justify-end"><button disabled={!activeMinisters.length} className="rounded-xl bg-[#4f7df3] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#aebbdc]">Save church attendance</button></div>
        </form>
      </section> : <div className="mt-7 rounded-2xl border border-[#dbe3f2] bg-[#f7f9fd] px-5 py-4 text-sm text-[#68738a]">Congregation attendance is read-only for church leaders. A super admin records each service total.</div>}

      <div className="mt-7 flex flex-wrap gap-2">{[7, 30, 90].map((days) => <a key={days} href={`/app/church-attendance?range=${days}`} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${selectedRange === days || (!params.from && !selectedRange && days === 90) ? "border-[#4f7df3] bg-[#edf2ff] text-[#4168cd]" : "border-[#dce3f1] bg-white text-[#5e6a81]"}`}>Last {days} days</a>)}</div>
      <form className="mt-3 grid gap-3 rounded-2xl border border-[#e0e6f2] bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr_auto_auto]">
        <label className="text-xs font-semibold text-[#68738a]">From<input type="date" name="from" defaultValue={from} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] px-3 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-[#68738a]">To<input type="date" name="to" defaultValue={to} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] px-3 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-[#68738a]">Service<select name="service" defaultValue={params.service ?? ""} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal"><option value="">All services</option>{serviceTypes.map((service) => <option key={service}>{service}</option>)}</select></label>
        <button className="self-end rounded-xl bg-[#edf2ff] px-5 py-3 text-sm font-semibold text-[#4168cd]">Apply</button>
        <a href="/app/church-attendance" className="self-end rounded-xl border border-[#dce3f1] px-5 py-3 text-center text-sm font-semibold text-[#68738a]">Clear</a>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[["Total attendance", total, `${rows.length} services`], ["Average per service", average, "All attendees"], ["Adult male", adultMale, `${percentage(adultMale, total)}% of attendance`], ["Adult female", adultFemale, `${percentage(adultFemale, total)}% of attendance`], ["Children", children, `${percentage(children, total)}% of attendance`]].map(([label, value, detail]) => <section key={label} className="rounded-2xl border border-[#e8e5da] bg-[#fbfaf5] p-5"><p className="text-sm text-[#6d6a60]">{label}</p><p className="mt-2 text-3xl font-semibold text-[#24231f]">{value}</p><p className="mt-2 text-xs text-[#8e8a7e]">{detail}</p></section>)}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-[#dbe8df] bg-[#f4faf6] p-5"><p className="text-sm text-[#52705c]">New members</p><p className="mt-2 text-3xl font-semibold text-[#244b32]">{newMembers}</p><p className="mt-2 text-xs text-[#718579]">{newMembersMale} male · {newMembersFemale} female</p></section>
        <section className="rounded-2xl border border-[#eadfca] bg-[#fffaf0] p-5"><p className="text-sm text-[#766344]">New converts</p><p className="mt-2 text-3xl font-semibold text-[#5c451d]">{newConverts}</p><p className="mt-2 text-xs text-[#8d7c5f]">{newConvertsMale} male · {newConvertsFemale} female</p></section>
      </div>

      <section className="mt-6 rounded-3xl border border-[#e0e6f2] bg-white p-5 sm:p-6">
        <div><h2 className="text-lg font-semibold">Total attendance trend</h2><p className="mt-1 text-xs text-[#8993a7]">Overall congregation attendance for each recorded service.</p></div>
        <div className="mt-5"><TrendLineChart points={trendPoints} title="Congregation attendance trend" /></div>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-[#e0e6f2] bg-white p-5 sm:p-6"><h2 className="text-lg font-semibold">New member trend</h2><p className="mt-1 text-xs text-[#8993a7]">New members identified at each service.</p><div className="mt-5"><TrendLineChart points={newMemberTrendPoints} title="New member trend" /></div></section>
        <section className="rounded-3xl border border-[#e0e6f2] bg-white p-5 sm:p-6"><h2 className="text-lg font-semibold">New convert trend</h2><p className="mt-1 text-xs text-[#8993a7]">New converts identified at each service.</p><div className="mt-5"><TrendLineChart points={newConvertTrendPoints} title="New convert trend" /></div></section>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-3xl border border-[#e0e6f2] bg-white p-5 sm:p-6"><h2 className="font-semibold">Attendance mix</h2><div className="mt-5 space-y-4">{[["Adult male", adultMale, "bg-[#4f7df3]"], ["Adult female", adultFemale, "bg-[#9b72d2]"], ["Children", children, "bg-[#e0ad35]"]].map(([label, value, color]) => <div key={label as string}><div className="flex justify-between text-xs font-semibold text-[#596274]"><span>{label}</span><span>{value} · {percentage(value as number, total)}%</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#eef1f6]"><div className={`h-full rounded-full ${color}`} style={{ width: `${percentage(value as number, total)}%` }} /></div></div>)}</div></section>
        <section className="rounded-3xl border border-[#e0e6f2] bg-white p-5 sm:p-6"><h2 className="font-semibold">Attendance by service type</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{byServiceType.length ? byServiceType.map(([name, count]) => <div key={name} className="rounded-2xl bg-[#f7f9fd] p-4"><p className="text-xs font-semibold text-[#68738a]">{name}</p><p className="mt-2 text-2xl font-semibold">{count}</p></div>) : <p className="py-8 text-sm text-[#8993a7]">No service data in this period.</p>}</div></section>
      </div>

      <section className="mt-6 overflow-hidden rounded-3xl border border-[#e0e1e5] bg-white">
        <div className="border-b border-[#e8ecf4] px-5 py-4 sm:px-6"><h2 className="font-semibold">Service log</h2></div>
        {rows.length ? <div className="divide-y divide-[#edf0f6]">{rows.map((row) => <article key={row.id} className="px-5 py-5 sm:px-6"><div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start"><div><p className="text-sm font-semibold text-[#34415f]">{row.services?.service_type ?? "Service"}</p><p className="mt-1 text-xs text-[#8993a7]">{row.services ? displayDate(row.services.service_date) : "Unknown date"} · Updated {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.updated_at))}</p><p className="mt-2 text-sm font-medium text-[#536078]">Minister: {row.ministers ? `${row.ministers.title ? `${row.ministers.title} ` : ""}${row.ministers.full_name}` : "Not recorded"}</p>{row.service_notes && <p className="mt-2 max-w-3xl whitespace-pre-wrap rounded-xl bg-[#f7f9fd] px-3 py-2 text-xs leading-5 text-[#68738a]">{row.service_notes}</p>}<div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-[#edf2ff] px-2.5 py-1 text-[#4168cd]">{row.adult_male_count} male</span><span className="rounded-full bg-[#f3eef9] px-2.5 py-1 text-[#7951ae]">{row.adult_female_count} female</span><span className="rounded-full bg-[#fff6dd] px-2.5 py-1 text-[#936b10]">{row.children_count} children</span><span className="rounded-full bg-[#edf8f1] px-2.5 py-1 text-[#2f7b50]">{row.new_members_male_count + row.new_members_female_count} new members ({row.new_members_male_count}M/{row.new_members_female_count}F)</span><span className="rounded-full bg-[#fff4e3] px-2.5 py-1 text-[#8d641d]">{row.new_converts_male_count + row.new_converts_female_count} new converts ({row.new_converts_male_count}M/{row.new_converts_female_count}F)</span></div></div><p className="text-2xl font-semibold sm:text-right">{row.total_count}<span className="ml-1 text-xs font-normal text-[#8993a7]">total</span></p></div>{profile.role === "super_admin" && <details className="mt-4 rounded-xl border border-[#e4e9f2] bg-[#fbfcff] p-3"><summary className="cursor-pointer text-xs font-semibold text-[#536078]">Correct attendance record</summary><p className="mt-2 text-xs leading-5 text-[#758097]">The service date and type stay unchanged. Correct the recorded counts, minister, or notes below.</p><form action={correctChurchAttendance} className="mt-3"><input type="hidden" name="attendance_id" value={row.id} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><label className="text-xs font-semibold text-[#68738a]">Adult male<input type="number" name="adult_male_count" min="0" step="1" required defaultValue={row.adult_male_count} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal" /></label><label className="text-xs font-semibold text-[#68738a]">Adult female<input type="number" name="adult_female_count" min="0" step="1" required defaultValue={row.adult_female_count} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal" /></label><label className="text-xs font-semibold text-[#68738a]">Children<input type="number" name="children_count" min="0" step="1" required defaultValue={row.children_count} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal" /></label><label className="text-xs font-semibold text-[#68738a]">New members — male<input type="number" name="new_members_male_count" min="0" step="1" required defaultValue={row.new_members_male_count} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal" /></label><label className="text-xs font-semibold text-[#68738a]">New members — female<input type="number" name="new_members_female_count" min="0" step="1" required defaultValue={row.new_members_female_count} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal" /></label><label className="text-xs font-semibold text-[#68738a]">New converts — male<input type="number" name="new_converts_male_count" min="0" step="1" required defaultValue={row.new_converts_male_count} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal" /></label><label className="text-xs font-semibold text-[#68738a]">New converts — female<input type="number" name="new_converts_female_count" min="0" step="1" required defaultValue={row.new_converts_female_count} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal" /></label><label className="text-xs font-semibold text-[#68738a]">Minister<select name="minister_id" required defaultValue={row.minister_id ?? ""} className="mt-2 h-11 w-full rounded-xl border border-[#dce3f1] bg-white px-3 text-sm font-normal"><option value="" disabled>Select minister</option>{activeMinisters.map((minister) => <option key={minister.id} value={minister.id}>{minister.title ? `${minister.title} ` : ""}{minister.full_name}</option>)}</select></label><label className="text-xs font-semibold text-[#68738a] sm:col-span-2 lg:col-span-1">Notes<textarea name="service_notes" maxLength={2000} rows={2} defaultValue={row.service_notes ?? ""} className="mt-2 w-full rounded-xl border border-[#dce3f1] bg-white px-3 py-2 text-sm font-normal" /></label></div><div className="mt-4 flex justify-end"><button className="rounded-xl bg-[#4f7df3] px-4 py-2.5 text-xs font-semibold text-white">Save correction</button></div></form></details>}</article>)}</div> : <p className="px-6 py-14 text-center text-sm text-[#8993a7]">No church attendance matches these filters.</p>}
      </section>
    </div>
  );
}
