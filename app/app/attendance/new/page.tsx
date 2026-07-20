import { redirect } from "next/navigation";
import { AttendanceForm } from "@/components/attendance-form";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { MetricPill, PageHeader } from "@/components/workspace-ui";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Log worker attendance", description: "Record today's worker attendance for your department." };

export default async function NewAttendancePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requireProfile();
  if (profile.role !== "department_head" || !profile.department_id) redirect("/app");

  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: department }, { data: workers, error }] = await Promise.all([
    supabase.from("departments").select("name").eq("id", profile.department_id).single(),
    supabase.from("workers").select("id, full_name, phone_number").eq("department_id", profile.department_id).eq("status", "Active").order("full_name"),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <WorkspaceNotice error={params.error ?? error?.message} />
      <PageHeader eyebrow="Department workers" title="Log worker attendance" description={`${department?.name ?? "Your department"} · Today's active workforce roster`} />
      <div className="mt-5 flex flex-wrap gap-2"><MetricPill label="Active workers" value={workers?.length ?? 0} /></div>
      <AttendanceForm workers={workers ?? []} />
    </div>
  );
}
