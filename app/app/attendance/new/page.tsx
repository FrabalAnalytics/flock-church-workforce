import { redirect } from "next/navigation";
import { AttendanceForm } from "@/components/attendance-form";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function NewAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { profile } = await requireProfile();
  if (profile.role !== "department_head" || !profile.department_id) redirect("/app");

  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: department }, { data: workers, error }] = await Promise.all([
    supabase.from("departments").select("name").eq("id", profile.department_id).single(),
    supabase
      .from("workers")
      .select("id, full_name, phone_number")
      .eq("department_id", profile.department_id)
      .eq("status", "Active")
      .order("full_name"),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <WorkspaceNotice error={params.error ?? error?.message} />
      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#4f7df3]">Department attendance</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Log attendance</h1>
      <p className="mt-2 text-sm text-[#758097]">
        {department?.name ?? "Your department"} · Today’s active workforce roster
      </p>
      <AttendanceForm workers={workers ?? []} />
    </div>
  );
}
