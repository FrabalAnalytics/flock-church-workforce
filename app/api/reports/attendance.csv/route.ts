import { createClient } from "@/lib/supabase/server";
import { reportChurchName, reportFilenameStem } from "@/lib/report-export";

const serviceTypes = new Set(["Sunday Service", "Tuesday Service", "Special Service", "Headquarters Service", "Tarry Night"]);

function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return new Response("Unauthorized", { status: 401 });

  const params = new URL(request.url).searchParams;
  let query = supabase
    .from("attendance_logs")
    .select("status, created_at, workers!inner(full_name), departments!inner(name), services!inner(service_date, service_type)")
    .order("service_date", { referencedTable: "services", ascending: false })
    .limit(10000);
  const from = params.get("from");
  const to = params.get("to");
  const department = params.get("department");
  const service = params.get("service");
  if (from) query = query.gte("services.service_date", from);
  if (to) query = query.lte("services.service_date", to);
  if (department) query = query.eq("department_id", department);
  if (service && serviceTypes.has(service)) query = query.eq("services.service_type", service);

  const [{ data, error }, { data: churchNameValue }] = await Promise.all([
    query,
    supabase.rpc("current_church_name"),
  ]);
  if (error) {
    console.error("Attendance export failed", error);
    return new Response("The attendance export could not be generated.", { status: 500 });
  }
  const header = ["Service date", "Service type", "Department", "Worker", "Status", "Recorded at"];
  const lines = (data ?? []).map((row) => {
    const worker = row.workers as unknown as { full_name: string } | null;
    const departmentRow = row.departments as unknown as { name: string } | null;
    const serviceRow = row.services as unknown as { service_date: string; service_type: string } | null;
    return [serviceRow?.service_date, serviceRow?.service_type, departmentRow?.name, worker?.full_name, row.status, row.created_at].map(csvCell).join(",");
  });
  const churchName = reportChurchName(churchNameValue);
  const preamble = [
    ["Church name", churchName],
    ["Report", "Worker attendance"],
    [],
  ].map((row) => row.map(csvCell).join(","));
  const csv = `\uFEFF${[...preamble, header.map(csvCell).join(","), ...lines].join("\r\n")}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${reportFilenameStem(churchName)}-worker-attendance-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
