"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function safeReturnPath(value: string) {
  try {
    const url = new URL(value, "https://flock.local");
    if (url.origin !== "https://flock.local" || url.pathname !== "/app/follow-ups") return "/app/follow-ups";
    const params = new URLSearchParams();
    const priority = url.searchParams.get("priority");
    const query = url.searchParams.get("q");
    if (["urgent", "watch", "early"].includes(priority ?? "")) params.set("priority", priority!);
    if (query) params.set("q", query.slice(0, 120));
    return `/app/follow-ups${params.size ? `?${params}` : ""}`;
  } catch {
    return "/app/follow-ups";
  }
}

function destination(type: "message" | "error", text: string, returnTo = "/app/follow-ups") {
  return `${returnTo}${returnTo.includes("?") ? "&" : "?"}${type}=${encodeURIComponent(text)}`;
}

export async function resolveFollowup(formData: FormData) {
  const returnTo = safeReturnPath(String(formData.get("return_to") ?? ""));
  const { profile } = await requireProfile();
  if (!['super_admin', 'department_head'].includes(profile.role)) {
    redirect(destination("error", "You do not have permission to resolve care alerts.", returnTo));
  }

  const followupId = String(formData.get("followup_id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!followupId) redirect(destination("error", "The care alert could not be identified.", returnTo));
  if (note.length > 2000) redirect(destination("error", "Resolution notes cannot exceed 2,000 characters.", returnTo));

  const supabase = await createClient();
  const { data: followup, error: readError } = await supabase
    .from("absence_followups")
    .select("notes, resolved")
    .eq("id", followupId)
    .single();

  if (readError || !followup) {
    redirect(destination("error", readError?.message ?? "Care alert not found.", returnTo));
  }
  if (followup.resolved) {
    redirect(destination("message", "This care alert is already resolved.", returnTo));
  }

  const notes = note
    ? `${followup.notes ? `${followup.notes}\n` : ""}${note}`
    : followup.notes;
  const { error } = await supabase
    .from("absence_followups")
    .update({ resolved: true, resolved_at: new Date().toISOString(), notes })
    .eq("id", followupId)
    .eq("resolved", false);

  if (error) redirect(destination("error", error.message, returnTo));

  revalidatePath("/app/follow-ups");
  revalidatePath("/app");
  redirect(destination("message", "Care alert resolved.", returnTo));
}
