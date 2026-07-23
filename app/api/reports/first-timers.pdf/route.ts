import { validateFirstTimerReportFilters } from "@/lib/first-timer-analytics";
import { createPdfReport, pdfDownloadResponse } from "@/lib/pdf-report";
import { loadFirstTimerMovementReport } from "@/lib/first-timer-report-server";
import { reportChurchName, reportFilenameStem, reportPeriod } from "@/lib/report-export";
import { createClient } from "@/lib/supabase/server";

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
    console.error("First-timer PDF export failed", report.error);
    return new Response("The first-timer PDF report could not be generated.", { status: 500 });
  }
  const churchName = reportChurchName(churchNameValue);
  const coordinatorScope = filters.coordinator === "unassigned"
    ? "Unassigned journeys"
    : filters.coordinator
      ? report.coordinators.find((coordinator) => coordinator.id === filters.coordinator)?.name ?? "Selected coordinator"
      : "All First Timers Coordinators";
  const pdf = await createPdfReport({
    churchName,
    title: "First-Timer Movement Analysis",
    period: reportPeriod(filters.from, filters.to),
    scope: `First-visit cohort | ${coordinatorScope}`,
    generatedBy: profile.full_name,
    summary: [
      { label: "First timers", value: report.analytics.total },
      { label: "Return rate", value: `${report.analytics.returnRate}%` },
      { label: "Member conversion", value: `${report.analytics.memberConversionRate}%` },
      { label: "Training completion", value: `${report.analytics.trainingCompletionRate}%` },
    ],
    charts: [
      { title: "Journey conversion funnel", type: "bar", points: report.analytics.funnel.map((step) => ({ label: step.label, value: step.count })) },
      { title: "Monthly first visits", type: "line", points: report.analytics.registrationTrend.map((point) => ({ label: point.label, value: point.value })) },
    ],
    tables: [
      {
        title: "Current stage distribution",
        columns: [
          { key: "stage", label: "Stage", width: 320 },
          { key: "count", label: "People", width: 100, align: "right" },
          { key: "share", label: "Cohort share", width: 120, align: "right" },
        ],
        rows: report.analytics.stageDistribution.map((stage) => ({ stage: stage.label, count: stage.count, share: `${report.analytics.total ? Math.round((stage.count / report.analytics.total) * 100) : 0}%` })),
      },
      {
        title: "Coordinator movement overview",
        columns: [
          { key: "coordinator", label: "Coordinator", width: 250 },
          { key: "journeys", label: "Journeys", width: 85, align: "right" },
          { key: "active", label: "Active", width: 80, align: "right" },
          { key: "overdue", label: "Overdue", width: 80, align: "right" },
          { key: "members", label: "Members", width: 80, align: "right" },
          { key: "conversion", label: "Conversion", width: 95, align: "right" },
        ],
        rows: report.analytics.coordinatorPerformance.map((row) => ({ ...row, conversion: `${row.conversionRate}%` })),
      },
      {
        title: "Journeys needing leadership attention",
        columns: [
          { key: "name", label: "First timer", width: 210 },
          { key: "stage", label: "Stage", width: 150 },
          { key: "coordinator", label: "Coordinator", width: 190 },
          { key: "days", label: "Days in stage", width: 90, align: "right" },
          { key: "reason", label: "Reason", width: 120 },
        ],
        rows: report.analytics.stalled.map((person) => ({ name: person.fullName, stage: person.stageLabel, coordinator: person.coordinator, days: person.daysInStage, reason: person.overdue ? "Follow-up overdue" : "No stage movement" })),
        emptyMessage: "No active journeys meet the leadership-attention threshold.",
      },
    ],
  });
  return pdfDownloadResponse(pdf, `${reportFilenameStem(churchName)}-first-timer-movement-${filters.from}-to-${filters.to}.pdf`);
}
