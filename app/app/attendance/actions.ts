"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const serviceTypes = new Set([
  "Sunday Service",
  "Tuesday Service",
  "Special Service",
  "Headquarters Service",
  "Tarry Night",
]);

function destination(type: "message" | "error", text: string) {
  return `/app/attendance${type === "error" ? "/new" : ""}?${type}=${encodeURIComponent(text)}`;
}

export async function submitAttendance(formData: FormData) {
  const { profile } = await requireProfile();

  if (profile.role !== "department_head" || !profile.department_id) {
    redirect(destination("error", "Only an assigned Department Head can submit attendance."));
  }

  const serviceType = String(formData.get("service_type") ?? "");
  const presentWorkerIds = formData
    .getAll("present_worker_ids")
    .map(String)
    .filter(Boolean);

  if (!serviceTypes.has(serviceType)) {
    redirect(destination("error", "Select a valid service type."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_department_attendance", {
    p_service_type: serviceType,
    p_present_worker_ids: presentWorkerIds,
  });

  if (error) {
    redirect(destination("error", error.message));
  }

  revalidatePath("/app/attendance");
  revalidatePath("/app");
  redirect(destination("message", `${serviceType} attendance was submitted.`));
}
