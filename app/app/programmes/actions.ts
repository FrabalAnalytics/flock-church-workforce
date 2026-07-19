"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

const serviceTypes = new Set(["Sunday Service", "Tuesday Service", "Special Service", "Headquarters Service", "Tarry Night"]);

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function destination(type: "message" | "error", text: string, programmeId?: string) {
  const params = new URLSearchParams({ [type]: text });
  if (programmeId) params.set("programme", programmeId);
  return `/app/programmes?${params}`;
}

function minutes(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const result = Number(match[1]) * 60 + Number(match[2]);
  return result >= 0 && result < 1440 ? result : null;
}

export async function createProgramme(formData: FormData) {
  await requireSuperAdmin();
  const templateId = value(formData, "template_id");
  const serviceDate = value(formData, "service_date");
  const serviceType = value(formData, "service_type");
  const title = value(formData, "title");
  if (!templateId || !/^\d{4}-\d{2}-\d{2}$/.test(serviceDate) || !serviceTypes.has(serviceType) || title.length < 3 || title.length > 160) {
    redirect(destination("error", "Complete the template, date, service type and title."));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_service_programme_from_template", {
    p_template_id: templateId,
    p_service_date: serviceDate,
    p_service_type: serviceType,
    p_title: title,
  });
  if (error) redirect(destination("error", error.message));
  revalidatePath("/app/programmes");
  redirect(destination("message", "Dated programme created from the template.", data));
}

export async function updateProgrammeItem(formData: FormData) {
  await requireSuperAdmin();
  const id = value(formData, "id");
  const programmeId = value(formData, "programme_id");
  const eventName = value(formData, "event_name");
  const responsibleName = value(formData, "responsible_name");
  const startTime = value(formData, "start_time");
  const endTime = value(formData, "end_time");
  const notes = value(formData, "notes") || null;
  const start = minutes(startTime);
  const end = minutes(endTime);
  if (!id || !programmeId || eventName.length < 2 || responsibleName.length < 2 || start === null || end === null || end <= start) {
    redirect(destination("error", "Enter valid times, activity and responsible person.", programmeId));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("service_programme_items").update({
    start_time: startTime,
    end_time: endTime,
    duration_minutes: end - start,
    event_name: eventName,
    responsible_name: responsibleName,
    notes,
  }).eq("id", id).eq("programme_id", programmeId);
  if (error) redirect(destination("error", error.message, programmeId));
  await supabase.from("service_programmes").update({ updated_at: new Date().toISOString() }).eq("id", programmeId);
  revalidatePath("/app/programmes");
  redirect(destination("message", "Programme item updated.", programmeId));
}

export async function addProgrammeItem(formData: FormData) {
  await requireSuperAdmin();
  const programmeId = value(formData, "programme_id");
  const eventName = value(formData, "event_name");
  const responsibleName = value(formData, "responsible_name");
  const startTime = value(formData, "start_time");
  const endTime = value(formData, "end_time");
  const start = minutes(startTime);
  const end = minutes(endTime);
  if (!programmeId || eventName.length < 2 || responsibleName.length < 2 || start === null || end === null || end <= start) {
    redirect(destination("error", "Enter valid details for the new programme item.", programmeId));
  }
  const supabase = await createClient();
  const { data: lastItem } = await supabase.from("service_programme_items").select("position").eq("programme_id", programmeId).order("position", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("service_programme_items").insert({ programme_id: programmeId, position: (lastItem?.position ?? 0) + 1, start_time: startTime, end_time: endTime, duration_minutes: end - start, event_name: eventName, responsible_name: responsibleName });
  if (error) redirect(destination("error", error.message, programmeId));
  await supabase.from("service_programmes").update({ updated_at: new Date().toISOString() }).eq("id", programmeId);
  revalidatePath("/app/programmes");
  redirect(destination("message", "Programme item added.", programmeId));
}

export async function removeProgrammeItem(formData: FormData) {
  await requireSuperAdmin();
  const id = value(formData, "id");
  const programmeId = value(formData, "programme_id");
  if (!id || !programmeId) redirect(destination("error", "Programme item was not found.", programmeId));
  const supabase = await createClient();
  const { error } = await supabase.from("service_programme_items").delete().eq("id", id).eq("programme_id", programmeId);
  if (error) redirect(destination("error", error.message, programmeId));
  await supabase.from("service_programmes").update({ updated_at: new Date().toISOString() }).eq("id", programmeId);
  revalidatePath("/app/programmes");
  redirect(destination("message", "Programme item removed.", programmeId));
}

export async function updateTemplateItem(formData: FormData) {
  await requireSuperAdmin();
  const id = value(formData, "id");
  const eventName = value(formData, "event_name");
  const responsibleName = value(formData, "responsible_name");
  const startTime = value(formData, "start_time");
  const endTime = value(formData, "end_time");
  const start = minutes(startTime);
  const end = minutes(endTime);
  if (!id || eventName.length < 2 || responsibleName.length < 2 || start === null || end === null || end <= start) {
    redirect(destination("error", "Enter valid template item details."));
  }
  const supabase = await createClient();
  const { error } = await supabase.from("service_programme_template_items").update({ start_time: startTime, end_time: endTime, duration_minutes: end - start, event_name: eventName, responsible_name: responsibleName }).eq("id", id);
  if (error) redirect(destination("error", error.message));
  revalidatePath("/app/programmes");
  redirect(destination("message", "Reusable template updated."));
}

export async function publishProgramme(formData: FormData) {
  const { user } = await requireSuperAdmin();
  const programmeId = value(formData, "programme_id");
  if (!programmeId) redirect(destination("error", "Programme was not found."));
  const supabase = await createClient();
  const { data: items, error: itemError } = await supabase.from("service_programme_items").select("position, start_time, end_time").eq("programme_id", programmeId).order("position");
  if (itemError || !items?.length) redirect(destination("error", itemError?.message ?? "Add at least one programme item.", programmeId));
  for (let index = 1; index < items.length; index += 1) {
    if (items[index].start_time < items[index - 1].end_time) redirect(destination("error", `Items ${items[index - 1].position} and ${items[index].position} overlap.`, programmeId));
  }
  const now = new Date().toISOString();
  const { error } = await supabase.from("service_programmes").update({ status: "published", published_by: user.id, published_at: now, updated_at: now }).eq("id", programmeId);
  if (error) redirect(destination("error", error.message, programmeId));
  revalidatePath("/app/programmes");
  redirect(destination("message", "Programme published to leaders and department heads.", programmeId));
}
