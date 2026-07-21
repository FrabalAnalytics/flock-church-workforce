"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

const serviceTypes = new Set([
  "Sunday Service",
  "Tuesday Service",
  "Special Service",
  "Headquarters Service",
  "Tarry Night",
]);

function safeReturnPath(value: string) {
  try {
    const url = new URL(value, "https://flock.local");
    if (url.origin !== "https://flock.local" || url.pathname !== "/app/service-days") {
      return "/app/service-days";
    }
    const date = url.searchParams.get("date");
    return /^\d{4}-\d{2}-\d{2}$/.test(date ?? "")
      ? `/app/service-days?date=${date}`
      : "/app/service-days";
  } catch {
    return "/app/service-days";
  }
}

function destination(returnTo: string, type: "message" | "error", text: string) {
  return `${returnTo}${returnTo.includes("?") ? "&" : "?"}${type}=${encodeURIComponent(text)}`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function scheduleServiceDay(formData: FormData) {
  await requireSuperAdmin();
  const serviceDate = String(formData.get("service_date") ?? "");
  const serviceType = String(formData.get("service_type") ?? "");
  const departmentIds = [...new Set(formData.getAll("department_ids").map(String).filter(isUuid))];
  const returnTo = safeReturnPath(`/app/service-days?date=${serviceDate}`);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate) || !serviceTypes.has(serviceType)) {
    redirect(destination(returnTo, "error", "Choose a valid service date and type."));
  }
  if (!departmentIds.length) {
    redirect(destination(returnTo, "error", "Select at least one expected department."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("schedule_service_day", {
    p_service_date: serviceDate,
    p_service_type: serviceType,
    p_department_ids: departmentIds,
  });

  if (error) redirect(destination(returnTo, "error", error.message));
  revalidatePath("/app/service-days");
  revalidatePath("/app/attendance/new");
  redirect(destination(returnTo, "message", `${serviceType} was scheduled successfully.`));
}

export async function changeServiceAttendanceStatus(formData: FormData) {
  await requireSuperAdmin();
  const returnTo = safeReturnPath(String(formData.get("return_to") ?? ""));
  const serviceId = String(formData.get("service_id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!isUuid(serviceId) || !["open", "closed"].includes(status)) {
    redirect(destination(returnTo, "error", "The service status request was invalid."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_service_attendance_status", {
    p_service_id: serviceId,
    p_status: status,
  });

  if (error) redirect(destination(returnTo, "error", error.message));
  revalidatePath("/app/service-days");
  revalidatePath("/app/attendance/new");
  redirect(destination(returnTo, "message", `Attendance was ${status === "closed" ? "closed" : "reopened"}.`));
}

export async function recordServiceReminder(formData: FormData) {
  await requireSuperAdmin();
  const returnTo = safeReturnPath(String(formData.get("return_to") ?? ""));
  const serviceId = String(formData.get("service_id") ?? "");
  const departmentId = String(formData.get("department_id") ?? "");

  if (!isUuid(serviceId) || !isUuid(departmentId)) {
    redirect(destination(returnTo, "error", "The reminder request was invalid."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_service_reminder", {
    p_service_id: serviceId,
    p_department_id: departmentId,
  });

  if (error) redirect(destination(returnTo, "error", error.message));
  revalidatePath("/app/service-days");
  redirect(destination(returnTo, "message", "The department reminder was recorded."));
}
