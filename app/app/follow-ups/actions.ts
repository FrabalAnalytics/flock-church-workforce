"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function destination(type: "message" | "error", text: string) {
  return `/app/follow-ups?${type}=${encodeURIComponent(text)}`;
}

export async function resolveFollowup(formData: FormData) {
  const { profile } = await requireProfile();
  if (!['super_admin', 'department_head'].includes(profile.role)) {
    redirect(destination("error", "You do not have permission to resolve care alerts."));
  }

  const followupId = String(formData.get("followup_id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!followupId) redirect(destination("error", "The care alert could not be identified."));

  const supabase = await createClient();
  const { data: followup, error: readError } = await supabase
    .from("absence_followups")
    .select("notes, resolved")
    .eq("id", followupId)
    .single();

  if (readError || !followup) {
    redirect(destination("error", readError?.message ?? "Care alert not found."));
  }
  if (followup.resolved) {
    redirect(destination("message", "This care alert is already resolved."));
  }

  const notes = note
    ? `${followup.notes ? `${followup.notes}\n` : ""}${note}`
    : followup.notes;
  const { error } = await supabase
    .from("absence_followups")
    .update({ resolved: true, resolved_at: new Date().toISOString(), notes })
    .eq("id", followupId)
    .eq("resolved", false);

  if (error) redirect(destination("error", error.message));

  revalidatePath("/app/follow-ups");
  revalidatePath("/app");
  redirect(destination("message", "Care alert resolved."));
}
