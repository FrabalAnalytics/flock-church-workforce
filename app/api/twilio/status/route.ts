import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateTwilioSignature } from "@/lib/twilio";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const eventId = request.nextUrl.searchParams.get("event_id");
  const signatureUrl = appUrl && eventId
    ? `${appUrl}/api/twilio/status?event_id=${encodeURIComponent(eventId)}`
    : request.url;

  if (!validateTwilioSignature(signatureUrl, params, request.headers.get("x-twilio-signature"))) {
    return NextResponse.json({ error: "Invalid Twilio signature" }, { status: 403 });
  }
  if (!eventId) return NextResponse.json({ error: "Missing event ID" }, { status: 400 });

  const providerStatus = params.get("MessageStatus") ?? "";
  const providerMessageId = params.get("MessageSid");
  const errorMessage = params.get("ErrorCode")
    ? `Twilio error ${params.get("ErrorCode")}`
    : null;
  const deliveryStatus = providerStatus === "delivered" || providerStatus === "read"
    ? "delivered"
    : providerStatus === "failed" || providerStatus === "undelivered"
      ? "failed"
      : providerStatus === "canceled"
        ? "cancelled"
        : "sent";

  const admin = createAdminClient();
  const updates: Record<string, string | null> = {
    delivery_status: deliveryStatus,
    provider_message_id: providerMessageId,
    error_message: errorMessage,
  };
  if (deliveryStatus === "delivered") updates.delivered_at = new Date().toISOString();

  let update = admin.from("followup_events").update(updates).eq("id", eventId);
  if (deliveryStatus === "sent") {
    // Do not let a late, lower-priority callback overwrite a terminal state.
    update = update.in("delivery_status", ["processing", "sent"]);
  }
  const { error } = await update;

  if (error) {
    console.error("Twilio status update failed", error);
    return NextResponse.json({ error: "Status update failed" }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
