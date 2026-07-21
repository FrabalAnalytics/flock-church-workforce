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

function safeAttendanceReturnPath(value: string) {
  try {
    const url = new URL(value, "https://flock.local");
    if (url.origin !== "https://flock.local" || url.pathname !== "/app/attendance") return "/app/attendance";
    const params = new URLSearchParams();
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const service = url.searchParams.get("service");
    const department = url.searchParams.get("department");
    if (/^\d{4}-\d{2}-\d{2}$/.test(from ?? "")) params.set("from", from!);
    if (/^\d{4}-\d{2}-\d{2}$/.test(to ?? "")) params.set("to", to!);
    if (serviceTypes.has(service ?? "")) params.set("service", service!);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(department ?? "")) params.set("department", department!);
    return `/app/attendance${params.size ? `?${params}` : ""}`;
  } catch {
    return "/app/attendance";
  }
}

function historyDestination(returnTo: string, type: "message" | "error", text: string) {
  return `${returnTo}${returnTo.includes("?") ? "&" : "?"}${type}=${encodeURIComponent(text)}`;
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
  redirect(destination("message", `${serviceType} worker attendance was submitted.`));
}

export async function correctSubmittedAttendance(formData: FormData) {
  const returnTo = safeAttendanceReturnPath(String(formData.get("return_to") ?? ""));
  const { profile } = await requireProfile();

  if (profile.role !== "super_admin") {
    redirect(historyDestination(returnTo, "error", "Only a super admin can correct submitted attendance."));
  }

  const submissionId = String(formData.get("submission_id") ?? "").trim();
  const presentWorkerIds = formData
    .getAll("present_worker_ids")
    .map(String)
    .filter(Boolean);

  if (!submissionId) {
    redirect(historyDestination(returnTo, "error", "Select a valid attendance submission."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("correct_department_attendance", {
    p_submission_id: submissionId,
    p_present_worker_ids: presentWorkerIds,
  });

  if (error) {
    redirect(historyDestination(returnTo, "error", error.message));
  }

  revalidatePath("/app/attendance");
  revalidatePath("/app");
  revalidatePath("/app/reports");
  revalidatePath("/app/follow-ups");
  redirect(historyDestination(returnTo, "message", "Submitted worker attendance was corrected."));
}
