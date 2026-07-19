import { createClient } from "@/lib/supabase/server";

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
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userData.user.id).single();
  if (!profile || !["super_admin", "church_leader"].includes(profile.role)) return new Response("Forbidden", { status: 403 });

  const params = new URL(request.url).searchParams;
  let query = supabase
    .from("church_attendance")
    .select("service_notes, adult_male_count, adult_female_count, children_count, new_members_male_count, new_members_female_count, new_converts_male_count, new_converts_female_count, total_count, updated_at, ministers(title, full_name), services!inner(service_date, service_type)")
    .order("service_date", { referencedTable: "services", ascending: false })
    .limit(5000);
  const from = params.get("from");
  const to = params.get("to");
  const service = params.get("service");
  if (from) query = query.gte("services.service_date", from);
  if (to) query = query.lte("services.service_date", to);
  if (service && serviceTypes.has(service)) query = query.eq("services.service_type", service);
  const { data, error } = await query;
  if (error) return new Response(error.message, { status: 400 });

  const header = ["Service date", "Service type", "Minister", "Service notes", "Adult male", "Adult female", "Children", "New members male", "New members female", "New members total", "New converts male", "New converts female", "New converts total", "Total attendance", "Updated at"];
  const lines = (data ?? []).map((row) => {
    const serviceRow = row.services as unknown as { service_date: string; service_type: string } | null;
    const minister = row.ministers as unknown as { title: string | null; full_name: string } | null;
    const ministerName = minister ? `${minister.title ? `${minister.title} ` : ""}${minister.full_name}` : "";
    return [serviceRow?.service_date, serviceRow?.service_type, ministerName, row.service_notes, row.adult_male_count, row.adult_female_count, row.children_count, row.new_members_male_count, row.new_members_female_count, row.new_members_male_count + row.new_members_female_count, row.new_converts_male_count, row.new_converts_female_count, row.new_converts_male_count + row.new_converts_female_count, row.total_count, row.updated_at].map(csvCell).join(",");
  });
  const csv = `\uFEFF${[header.map(csvCell).join(","), ...lines].join("\r\n")}`;
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="flock-church-attendance-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "private, no-store" } });
}
