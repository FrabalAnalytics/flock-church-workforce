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
  return `/app/church-attendance?${type}=${encodeURIComponent(text)}`;
}

function count(formData: FormData, field: string) {
  const raw = String(formData.get(field) ?? "").trim();
  const parsed = Number(raw);
  return raw !== "" && Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export async function submitChurchAttendance(formData: FormData) {
  const { profile } = await requireProfile();
  if (profile.role !== "super_admin") {
    redirect(destination("error", "Only a super admin can record church attendance."));
  }

  const serviceDate = String(formData.get("service_date") ?? "");
  const serviceType = String(formData.get("service_type") ?? "");
  const ministerId = String(formData.get("minister_id") ?? "").trim();
  const serviceNotes = String(formData.get("service_notes") ?? "").trim();
  const adultMaleCount = count(formData, "adult_male_count");
  const adultFemaleCount = count(formData, "adult_female_count");
  const childrenCount = count(formData, "children_count");
  const newMembersMaleCount = count(formData, "new_members_male_count");
  const newMembersFemaleCount = count(formData, "new_members_female_count");
  const newConvertsMaleCount = count(formData, "new_converts_male_count");
  const newConvertsFemaleCount = count(formData, "new_converts_female_count");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate) || !serviceTypes.has(serviceType)) {
    redirect(destination("error", "Select a valid service date and service type."));
  }
  if (!ministerId) redirect(destination("error", "Select the minister for this service."));
  if (serviceNotes.length > 2000) redirect(destination("error", "Service notes cannot exceed 2,000 characters."));
  if (
    adultMaleCount === null || adultFemaleCount === null || childrenCount === null
    || newMembersMaleCount === null || newMembersFemaleCount === null
    || newConvertsMaleCount === null || newConvertsFemaleCount === null
  ) {
    redirect(destination("error", "Enter zero or a positive whole number for every attendance group."));
  }
  if (
    newMembersMaleCount + newConvertsMaleCount > adultMaleCount
    || newMembersFemaleCount + newConvertsFemaleCount > adultFemaleCount
  ) {
    redirect(destination("error", "New members and new converts must be different people already included in the matching adult total."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_church_attendance", {
    p_service_date: serviceDate,
    p_service_type: serviceType,
    p_adult_male_count: adultMaleCount,
    p_adult_female_count: adultFemaleCount,
    p_children_count: childrenCount,
    p_new_members_male_count: newMembersMaleCount,
    p_new_members_female_count: newMembersFemaleCount,
    p_new_converts_male_count: newConvertsMaleCount,
    p_new_converts_female_count: newConvertsFemaleCount,
    p_minister_id: ministerId,
    p_service_notes: serviceNotes || null,
  });
  if (error) redirect(destination("error", error.message));

  revalidatePath("/app/church-attendance");
  redirect(destination("message", `${serviceType} congregation attendance was saved.`));
}

export async function correctChurchAttendance(formData: FormData) {
  const { profile } = await requireProfile();
  if (profile.role !== "super_admin") redirect(destination("error", "Only a super admin can correct church attendance."));

  const attendanceId = String(formData.get("attendance_id") ?? "").trim();
  const ministerId = String(formData.get("minister_id") ?? "").trim();
  const serviceNotes = String(formData.get("service_notes") ?? "").trim();
  const adultMaleCount = count(formData, "adult_male_count");
  const adultFemaleCount = count(formData, "adult_female_count");
  const childrenCount = count(formData, "children_count");
  const newMembersMaleCount = count(formData, "new_members_male_count");
  const newMembersFemaleCount = count(formData, "new_members_female_count");
  const newConvertsMaleCount = count(formData, "new_converts_male_count");
  const newConvertsFemaleCount = count(formData, "new_converts_female_count");
  if (!attendanceId || !ministerId) redirect(destination("error", "Select a valid service record and minister."));
  if (serviceNotes.length > 2000) redirect(destination("error", "Service notes cannot exceed 2,000 characters."));
  if (
    adultMaleCount === null || adultFemaleCount === null || childrenCount === null
    || newMembersMaleCount === null || newMembersFemaleCount === null
    || newConvertsMaleCount === null || newConvertsFemaleCount === null
  ) {
    redirect(destination("error", "Enter zero or a positive whole number for every attendance group."));
  }
  if (
    newMembersMaleCount + newConvertsMaleCount > adultMaleCount
    || newMembersFemaleCount + newConvertsFemaleCount > adultFemaleCount
  ) {
    redirect(destination("error", "New members and new converts must be different people already included in the matching adult total."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("correct_church_attendance", {
    p_attendance_id: attendanceId,
    p_adult_male_count: adultMaleCount,
    p_adult_female_count: adultFemaleCount,
    p_children_count: childrenCount,
    p_new_members_male_count: newMembersMaleCount,
    p_new_members_female_count: newMembersFemaleCount,
    p_new_converts_male_count: newConvertsMaleCount,
    p_new_converts_female_count: newConvertsFemaleCount,
    p_minister_id: ministerId,
    p_service_notes: serviceNotes || null,
  });
  if (error) redirect(destination("error", error.message));
  revalidatePath("/app/church-attendance");
  revalidatePath("/app");
  revalidatePath("/app/reports");
  redirect(destination("message", "Congregation attendance correction was saved."));
}
