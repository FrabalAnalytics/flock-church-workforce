import { createPdfReport, pdfDownloadResponse } from "@/lib/pdf-report";
import { parseReportFilters, reportChurchName, reportFilenameStem, reportPeriod } from "@/lib/report-export";
import { createClient } from "@/lib/supabase/server";

type ChurchRow = {
  adult_male_count: number;
  adult_female_count: number;
  children_count: number;
  new_members_male_count: number;
  new_members_female_count: number;
  new_converts_male_count: number;
  new_converts_female_count: number;
  total_count: number;
  ministers: { title: string | null; full_name: string } | null;
  services: { service_date: string; service_type: string } | null;
};

function chartDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`));
}

export async function GET(request: Request) {
  const filters = parseReportFilters(request.url);
  if ("error" in filters) return new Response(filters.error, { status: 400 });

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return new Response("Unauthorized", { status: 401 });
  const [{ data: profile }, { data: churchNameValue }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", userData.user.id)
      .single(),
    supabase.rpc("current_church_name"),
  ]);
  if (!profile || !["super_admin", "church_leader"].includes(profile.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  let query = supabase
    .from("church_attendance")
    .select("adult_male_count, adult_female_count, children_count, new_members_male_count, new_members_female_count, new_converts_male_count, new_converts_female_count, total_count, ministers(title, full_name), services!inner(service_date, service_type)")
    .gte("services.service_date", filters.from)
    .lte("services.service_date", filters.to)
    .order("service_date", { referencedTable: "services", ascending: false })
    .limit(2000);
  if (filters.service) query = query.eq("services.service_type", filters.service);
  const { data, error } = await query;
  if (error) {
    console.error("Church attendance PDF export failed", error);
    return new Response("The PDF report could not be generated.", { status: 500 });
  }

  const rows = (data ?? []) as unknown as ChurchRow[];
  const total = rows.reduce((sum, row) => sum + row.total_count, 0);
  const newMembers = rows.reduce((sum, row) => sum + row.new_members_male_count + row.new_members_female_count, 0);
  const newConverts = rows.reduce((sum, row) => sum + row.new_converts_male_count + row.new_converts_female_count, 0);
  const byServiceType = [...rows.reduce((groups, row) => {
    const service = row.services?.service_type ?? "Unknown service";
    const current = groups.get(service) ?? { services: 0, attendance: 0, newMembers: 0, newConverts: 0 };
    current.services += 1;
    current.attendance += row.total_count;
    current.newMembers += row.new_members_male_count + row.new_members_female_count;
    current.newConverts += row.new_converts_male_count + row.new_converts_female_count;
    groups.set(service, current);
    return groups;
  }, new Map<string, { services: number; attendance: number; newMembers: number; newConverts: number }>())]
    .map(([service, totals]) => ({ service, ...totals, average: totals.services ? Math.round(totals.attendance / totals.services) : 0 }))
    .sort((a, b) => b.attendance - a.attendance);
  const congregationTrend = rows
    .filter((row) => Boolean(row.services?.service_date))
    .map((row) => ({ label: chartDate(row.services!.service_date), value: row.total_count, date: row.services!.service_date }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10);

  const churchName = reportChurchName(churchNameValue);
  const pdf = await createPdfReport({
    churchName,
    title: "Congregation attendance report",
    period: reportPeriod(filters.from, filters.to),
    scope: `${filters.service ?? "All service types"} | Aggregate counts only - no attendee identities`,
    generatedBy: profile.full_name,
    summary: [
      { label: "Services recorded", value: rows.length },
      { label: "Total attendance", value: total },
      { label: "Average per service", value: rows.length ? Math.round(total / rows.length) : 0 },
      { label: "First steps", value: newMembers + newConverts },
    ],
    charts: [
      {
        title: "Congregation attendance trend",
        type: "line",
        points: congregationTrend,
      },
      {
        title: "Average attendance by service type",
        type: "bar",
        points: [...byServiceType]
          .sort((a, b) => b.average - a.average)
          .map((service) => ({ label: service.service, value: service.average })),
      },
    ],
    tables: [
      {
        title: "Service type summary",
        columns: [
          { key: "service", label: "Service type", width: 260 },
          { key: "services", label: "Services", width: 90, align: "right" },
          { key: "attendance", label: "Attendance", width: 100, align: "right" },
          { key: "average", label: "Average", width: 90, align: "right" },
          { key: "newMembers", label: "New members", width: 100, align: "right" },
          { key: "newConverts", label: "New converts", width: 100, align: "right" },
        ],
        rows: byServiceType,
      },
      {
        title: "Congregation service log",
        columns: [
          { key: "date", label: "Date", width: 75 },
          { key: "service", label: "Service", width: 125 },
          { key: "minister", label: "Minister", width: 150 },
          { key: "male", label: "Male", width: 55, align: "right" },
          { key: "female", label: "Female", width: 55, align: "right" },
          { key: "children", label: "Children", width: 60, align: "right" },
          { key: "members", label: "New members", width: 75, align: "right" },
          { key: "converts", label: "New converts", width: 75, align: "right" },
          { key: "total", label: "Total", width: 60, align: "right" },
        ],
        rows: rows.map((row) => ({
          date: row.services?.service_date ?? "",
          service: row.services?.service_type ?? "Service",
          minister: row.ministers ? `${row.ministers.title ? `${row.ministers.title} ` : ""}${row.ministers.full_name}` : "",
          male: row.adult_male_count,
          female: row.adult_female_count,
          children: row.children_count,
          members: row.new_members_male_count + row.new_members_female_count,
          converts: row.new_converts_male_count + row.new_converts_female_count,
          total: row.total_count,
        })),
      },
    ],
  });
  return pdfDownloadResponse(pdf, `${reportFilenameStem(churchName)}-congregation-attendance-${filters.from}-to-${filters.to}.pdf`);
}
