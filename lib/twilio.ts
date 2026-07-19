import { createHmac, timingSafeEqual } from "node:crypto";

type TwilioMessage = {
  sid?: string;
  message?: string;
  code?: number;
};

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function twilioConfig() {
  return {
    accountSid: required("TWILIO_ACCOUNT_SID"),
    authToken: required("TWILIO_AUTH_TOKEN"),
    from: required("TWILIO_WHATSAPP_FROM"),
    appUrl: required("NEXT_PUBLIC_APP_URL").replace(/\/$/, ""),
    softContentSid: required("TWILIO_SOFT_MESSAGE_CONTENT_SID"),
    urgentContentSid: required("TWILIO_URGENT_MESSAGE_CONTENT_SID"),
  };
}

export async function sendWhatsAppTemplate(input: {
  to: string;
  contentSid: string;
  variables: Record<string, string>;
  statusCallback: string;
}) {
  const config = twilioConfig();
  const body = new URLSearchParams({
    To: input.to.startsWith("whatsapp:") ? input.to : `whatsapp:${input.to}`,
    From: config.from.startsWith("whatsapp:") ? config.from : `whatsapp:${config.from}`,
    ContentSid: input.contentSid,
    ContentVariables: JSON.stringify(input.variables),
    StatusCallback: input.statusCallback,
  });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(15_000),
    },
  );
  const result = (await response.json()) as TwilioMessage;

  if (!response.ok || !result.sid) {
    throw new Error(result.message ?? `Twilio returned HTTP ${response.status}.`);
  }

  return result.sid;
}

export function validateTwilioSignature(url: string, params: URLSearchParams, signature: string | null) {
  if (!signature) return false;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const values = [...new Set(params.keys())]
    .sort()
    .flatMap((key) => params.getAll(key).sort().map((value) => `${key}${value}`))
    .join("");
  const expected = createHmac("sha1", authToken).update(`${url}${values}`).digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}
