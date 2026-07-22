import { createPdfReport, pdfDownloadResponse } from "@/lib/pdf-report";
import { parseReportFilters, reportPeriod } from "@/lib/report-export";
import { createClient } from "@/lib/supabase/server";

type SubmissionRow = {
  roster_count: number;
  present_count: number;
  absent_count: number;
  departments: { name: string } | null;
  services: { id: string; service_date: string; service_type: string } | null;
};

function rate(present: number, roster: number) {
  return roster ? Math.min(100, Math.round((present / roster) * 100)) : 0;
}

export async function GET(request: Request) {
  const filters = parseReportFilters(request.url);
  if ("error" in filters) return new Response(filters.error, { status: 400 });

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return new Response("Unauthorized", { status: 401 });
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", userData.user.id)
    .single();
  if (!profile || !["super_admin", "church_leader", "department_head"].includes(profile.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  let query = supabase
    .from("attendance_submissions")
    .select("roster_count, present_count, absent_count, departments(name), services!inner(id, service_date, service_type)")
    .gte("services.service_date", filters.from)
    .lte("services.service_date", filters.to)
    .order("service_date", { referencedTable: "services", ascending: false })
    .limit(5000);
  if (filters.department) query = query.eq("department_id", filters.department);
  if (filters.service) query = query.eq("services.service_type", filters.service);
  const { data, error } = await query;
  if (error) {
    console.error("Attendance PDF export failed", error);
    return new Response("The PDF report could not be generated.", { status: 500 });
  }

  const rows = (data ?? []) as unknown as SubmissionRow[];
  const present = rows.reduce((sum, row) => sum + row.present_count, 0);
  const absent = rows.reduce((sum, row) => sum + row.absent_count, 0);
  const roster = present + absent;
  const serviceCount = new Set(rows.map((row) => row.services?.id).filter(Boolean)).size;
  const departments = [...rows.reduce((groups, row) => {
    const name = row.departments?.name ?? "Unknown department";
    const current = groups.get(name) ?? { submissions: 0, roster: 0, present: 0, absent: 0 };
    current.submissions += 1;
    current.roster += row.roster_count;
    current.present += row.present_count;
    current.absent += row.absent_count;
    groups.set(name, current);
    return groups;
  }, new Map<string, { submissions: number; roster: number; present: number; absent: number }>())]
    .map(([department, totals]) => ({ department, ...totals, rate: `${rate(totals.present, totals.roster)}%` }))
    .sort((a, b) => b.present - a.present);

  const scopeParts = [filters.service ?? "All service types"];
  if (filters.department) scopeParts.push(departments[0]?.department ?? "Selected department");
  else scopeParts.push(profile.role === "department_head" ? "Assigned department" : "All visible departments");
  const pdf = await createPdfReport({
    title: "Worker attendance report",
    period: reportPeriod(filters.from, filters.to),
    scope: scopeParts.join(" | "),
    generatedBy: profile.full_name,
    summary: [
      { label: "Services logged", value: serviceCount },
      { label: "Submissions", value: rows.length },
      { label: "Workers present", value: present },
      { label: "Attendance rate", value: `${rate(present, roster)}%` },
    ],
    tables: [
      {
        title: "Department comparison",
        columns: [
          { key: "department", label: "Department", width: 220 },
          { key: "submissions", label: "Submissions", width: 90, align: "right" },
          { key: "roster", label: "Expected", width: 90, align: "right" },
          { key: "present", label: "Present", width: 90, align: "right" },
          { key: "absent", label: "Absent", width: 90, align: "right" },
          { key: "rate", label: "Rate", width: 90, align: "right" },
        ],
        rows: departments,
      },
      {
        title: "Service submission log",
        columns: [
          { key: "date", label: "Date", width: 80 },
          { key: "service", label: "Service", width: 150 },
          { key: "department", label: "Department", width: 170 },
          { key: "roster", label: "Expected", width: 75, align: "right" },
          { key: "present", label: "Present", width: 75, align: "right" },
          { key: "absent", label: "Absent", width: 75, align: "right" },
          { key: "rate", label: "Rate", width: 65, align: "right" },
        ],
        rows: rows.map((row) => ({
          date: row.services?.service_date ?? "",
          service: row.services?.service_type ?? "Service",
          department: row.departments?.name ?? "Department",
          roster: row.roster_count,
          present: row.present_count,
          absent: row.absent_count,
          rate: `${rate(row.present_count, row.roster_count)}%`,
        })),
      },
    ],
  });
  return pdfDownloadResponse(pdf, `flock-worker-attendance-${filters.from}-to-${filters.to}.pdf`);
}
