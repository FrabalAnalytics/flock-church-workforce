import { redirect } from "next/navigation";
import { AttendanceForm } from "@/components/attendance-form";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { MetricPill, PageHeader } from "@/components/workspace-ui";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Log worker attendance", description: "Record today's worker attendance for your department." };

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

export default async function NewAttendancePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requireProfile();
  if (profile.role !== "department_head" || !profile.department_id) redirect("/app");

  const params = await searchParams;
  const supabase = await createClient();
  const today = lagosDate();
  const [departmentResult, workersResult, submissionsResult, servicesResult] = await Promise.all([
    supabase.from("departments").select("name").eq("id", profile.department_id).single(),
    supabase.from("workers").select("id, full_name, phone_number").eq("department_id", profile.department_id).eq("status", "Active").order("full_name"),
    supabase.from("attendance_submissions").select("id, services!inner(service_date, service_type)").eq("services.service_date", today),
    supabase.from("services").select("id, service_type, attendance_status, attendance_managed").eq("service_date", today),
  ]);
  const department = departmentResult.data;
  const workers = workersResult.data;
  const submittedServiceTypes = [...new Set((submissionsResult.data ?? []).map((submission) => {
    const service = submission.services as unknown as { service_type: string } | null;
    return service?.service_type;
  }).filter((service): service is string => Boolean(service)))];
  const managedServices = (servicesResult.data ?? []).filter((service) => service.attendance_managed);
  const managedServiceIds = managedServices.map((service) => service.id);
  const expectationsResult = managedServiceIds.length
    ? await supabase
        .from("service_department_expectations")
        .select("service_id")
        .eq("department_id", profile.department_id)
        .in("service_id", managedServiceIds)
    : { data: [], error: null };
  const expectedServiceIds = new Set((expectationsResult.data ?? []).map((expectation) => expectation.service_id));
  const availableServiceTypes = managedServices.length
    ? managedServices
        .filter((service) => service.attendance_status === "open" && expectedServiceIds.has(service.id))
        .map((service) => service.service_type)
    : undefined;
  const scheduleMessage = managedServices.length
    ? availableServiceTypes?.length
      ? "Showing open services assigned to your department by the service-day schedule."
      : "Your department has no open attendance submission for today's scheduled services."
    : undefined;

  return (
    <div className="mx-auto max-w-5xl">
      <WorkspaceNotice error={params.error ?? departmentResult.error?.message ?? workersResult.error?.message ?? submissionsResult.error?.message ?? servicesResult.error?.message ?? expectationsResult.error?.message} />
      <PageHeader eyebrow="Department workers" title="Log worker attendance" description={`${department?.name ?? "Your department"} · Today's active workforce roster`} />
      <div className="mt-5 flex flex-wrap gap-2"><MetricPill label="Active workers" value={workers?.length ?? 0} /><MetricPill label="Submitted today" value={submittedServiceTypes.length} /></div>
      {submittedServiceTypes.length > 0 && <section className="mt-6 rounded-2xl border border-[#cfe3d5] bg-[#f4faf6] px-4 py-4 sm:px-5" aria-label="Today's completed attendance"><p className="text-sm font-semibold text-[#347457]">Already submitted today</p><div className="mt-3 flex flex-wrap gap-2">{submittedServiceTypes.map((service) => <span key={service} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#347457] shadow-[var(--shadow-sm)]">✓ {service}</span>)}</div><p className="mt-3 text-xs leading-5 text-[#668071]">You can select one of these services to make a correction, but saving will replace its current worker statuses.</p></section>}
      <AttendanceForm workers={workers ?? []} submittedServiceTypes={submittedServiceTypes} availableServiceTypes={availableServiceTypes} scheduleMessage={scheduleMessage} />
    </div>
  );
}
