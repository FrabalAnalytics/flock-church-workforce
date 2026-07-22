"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { validNotificationKey } from "@/lib/notification-state";
import { createClient } from "@/lib/supabase/server";

async function notificationIdentity(formData: FormData) {
  const { user } = await requireProfile();
  const notificationKey = validNotificationKey(String(formData.get("notification_key") ?? ""));
  if (!notificationKey) throw new Error("Invalid notification identifier.");
  return { userId: user.id, notificationKey };
}

export async function markNotificationRead(formData: FormData) {
  const { userId, notificationKey } = await notificationIdentity(formData);
  const supabase = await createClient();
  const { error } = await supabase.from("notification_states").upsert({
    user_id: userId,
    notification_key: notificationKey,
    read_at: new Date().toISOString(),
    snoozed_until: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,notification_key" });
  if (error) throw new Error(error.message);
  revalidatePath("/app/action-centre");
}

export async function snoozeNotification(formData: FormData) {
  const { userId, notificationKey } = await notificationIdentity(formData);
  const now = new Date();
  const snoozedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const supabase = await createClient();
  const { error } = await supabase.from("notification_states").upsert({
    user_id: userId,
    notification_key: notificationKey,
    read_at: now.toISOString(),
    snoozed_until: snoozedUntil.toISOString(),
    updated_at: now.toISOString(),
  }, { onConflict: "user_id,notification_key" });
  if (error) throw new Error(error.message);
  revalidatePath("/app/action-centre");
}

export async function restoreNotification(formData: FormData) {
  const { userId, notificationKey } = await notificationIdentity(formData);
  const supabase = await createClient();
  const { error } = await supabase
    .from("notification_states")
    .update({ snoozed_until: null, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("notification_key", notificationKey);
  if (error) throw new Error(error.message);
  revalidatePath("/app/action-centre");
}
