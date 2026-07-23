import { validateFirstTimerReportFilters } from "@/lib/first-timer-analytics";
import { firstTimerStageLabels, membershipTrainingStatusLabels } from "@/lib/first-timers";
import { loadFirstTimerMovementReport } from "@/lib/first-timer-report-server";
import { reportChurchName, reportFilenameStem } from "@/lib/report-export";
import { createClient } from "@/lib/supabase/server";

function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const filters = validateFirstTimerReportFilters({ from: params.get("from"), to: params.get("to"), coordinator: params.get("coordinator") });
  if (typeof filters === "string") return new Response(filters, { status: 400 });
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return new Response("Unauthorized", { status: 401 });
  const [{ data: profile }, { data: churchNameValue }] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", userData.user.id).single(),
    supabase.rpc("current_church_name"),
  ]);
  if (!profile || !["super_admin", "church_leader"].includes(profile.role)) return new Response("Forbidden", { status: 403 });

  const report = await loadFirstTimerMovementReport(filters);
  if (report.error) {
    console.error("First-timer CSV export failed", report.error);
    return new Response("The first-timer report could not be generated.", { status: 500 });
  }
  const coordinatorNames = new Map(report.coordinators.map((coordinator) => [coordinator.id, coordinator.name]));
  const header = ["First visit", "First timer", "Current stage", "Recorded visits", "Training status", "Training started", "Training completed", "Coordinator", "Next follow-up"];
  const rows = report.people.map((person) => [
    person.firstVisitDate,
    person.fullName,
    firstTimerStageLabels[person.journeyStage],
    person.visits.length,
    membershipTrainingStatusLabels[person.trainingStatus],
    person.trainingStartedAt,
    person.trainingCompletedAt,
    person.assignedTo ? coordinatorNames.get(person.assignedTo) ?? "Former coordinator" : "Unassigned",
    person.nextFollowupAt,
  ].map(csvCell).join(","));
  const churchName = reportChurchName(churchNameValue);
  const preamble = [
    ["Church name", churchName],
    ["Report", "First-timer movement analysis"],
    ["First-visit cohort", `${filters.from} to ${filters.to}`],
    ["First timers", report.analytics.total],
    ["Return rate", `${report.analytics.returnRate}%`],
    ["Member conversion", `${report.analytics.memberConversionRate}%`],
    [],
  ].map((row) => row.map(csvCell).join(","));
  const csv = `\uFEFF${[...preamble, header.map(csvCell).join(","), ...rows].join("\r\n")}`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${reportFilenameStem(churchName)}-first-timer-movement-${filters.from}-to-${filters.to}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
