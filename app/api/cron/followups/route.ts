import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTemplate, twilioConfig } from "@/lib/twilio";

export const runtime = "nodejs";

type ClaimedEvent = {
  id: string;
  worker_id: string;
  event_type: "soft_message" | "urgent_message";
};

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

async function processQueuedFollowups(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const config = twilioConfig();
    const { data: claimed, error: claimError } = await admin.rpc("claim_queued_followup_events", { p_limit: 25 });
    if (claimError) throw claimError;

    const events = (claimed ?? []) as ClaimedEvent[];
    const results = await Promise.all(events.map(async (event) => {
      const { data: worker, error: workerError } = await admin
        .from("workers")
        .select("full_name, phone_number, whatsapp_opt_in, departments(name)")
        .eq("id", event.worker_id)
        .single();

      if (workerError || !worker?.phone_number || !worker.whatsapp_opt_in) {
        await admin.from("followup_events").update({
          delivery_status: "cancelled",
          error_message: workerError?.message ?? "Worker has no eligible opted-in WhatsApp number.",
        }).eq("id", event.id);
        return { id: event.id, status: "cancelled" };
      }

      const department = worker.departments as unknown as { name: string } | null;
      const contentSid = event.event_type === "soft_message" ? config.softContentSid : config.urgentContentSid;
      const variables = event.event_type === "soft_message"
        ? { "1": worker.full_name, "2": department?.name ?? "your" }
        : { "1": worker.full_name, "2": department?.name ?? "your department" };

      try {
        const providerMessageId = await sendWhatsAppTemplate({
          to: worker.phone_number,
          contentSid,
          variables,
          statusCallback: `${config.appUrl}/api/twilio/status?event_id=${encodeURIComponent(event.id)}`,
        });
        await admin.from("followup_events").update({
          delivery_status: "sent",
          provider_message_id: providerMessageId,
          sent_at: new Date().toISOString(),
          error_message: null,
        }).eq("id", event.id);
        return { id: event.id, status: "sent" };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown Twilio delivery error";
        await admin.from("followup_events").update({ delivery_status: "failed", error_message: message }).eq("id", event.id);
        return { id: event.id, status: "failed" };
      }
    }));

    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delivery worker failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return processQueuedFollowups(request);
}

export async function POST(request: NextRequest) {
  return processQueuedFollowups(request);
}
