"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin";
import { validateChurchSettings, validateTestPhone } from "@/lib/system-health";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppTemplate, twilioConfig } from "@/lib/twilio";

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function destination(type: "message" | "error", message: string) {
  return `/app/settings?${type}=${encodeURIComponent(message)}`;
}

export async function updateChurchSettings(formData: FormData) {
  const { user } = await requireSuperAdmin();
  const result = validateChurchSettings({
    churchName: value(formData, "church_name"),
    timezone: value(formData, "timezone"),
    careMessageSignature: value(formData, "care_message_signature"),
    contactEmail: value(formData, "contact_email"),
    contactPhone: value(formData, "contact_phone"),
  });
  if (!result.value) redirect(destination("error", result.error));

  const supabase = await createClient();
  const { error } = await supabase.from("church_settings").upsert({
    id: "00000000-0000-4000-8000-000000000001",
    church_name: result.value.churchName,
    timezone: result.value.timezone,
    care_message_signature: result.value.careMessageSignature,
    contact_email: result.value.contactEmail || null,
    contact_phone: result.value.contactPhone || null,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  });
  if (error) redirect(destination("error", error.message));

  revalidatePath("/app", "layout");
  redirect(destination("message", "Church settings saved."));
}

export async function sendSystemTestMessage(formData: FormData) {
  await requireSuperAdmin();
  const phone = validateTestPhone(value(formData, "test_phone"));
  if (!phone) {
    redirect(destination("error", "Enter a test number in international format, such as +2348012345678."));
  }

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("church_settings")
    .select("church_name, care_message_signature")
    .eq("id", "00000000-0000-4000-8000-000000000001")
    .maybeSingle();

  try {
    const config = twilioConfig();
    await sendWhatsAppTemplate({
      to: phone,
      contentSid: config.softContentSid,
      variables: {
        "1": "Flock Admin",
        "2": settings?.church_name ?? settings?.care_message_signature ?? "your church",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The WhatsApp test could not be sent.";
    redirect(destination("error", message));
  }

  redirect(destination("message", `A WhatsApp test was accepted for ${phone}.`));
}
