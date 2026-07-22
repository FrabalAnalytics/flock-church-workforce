import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateEnvironment,
  validateChurchSettings,
  validateTestPhone,
} from "../lib/system-health.ts";

test("environment health reports a fully configured production deployment", () => {
  const health = evaluateEnvironment({
    NEXT_PUBLIC_APP_URL: "https://flock.example",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    SUPABASE_SECRET_KEY: "secret",
    CRON_SECRET: "cron",
    TWILIO_ACCOUNT_SID: "AC123",
    TWILIO_AUTH_TOKEN: "token",
    TWILIO_WHATSAPP_FROM: "whatsapp:+10000000000",
    TWILIO_SOFT_MESSAGE_CONTENT_SID: "HXsoft",
    TWILIO_URGENT_MESSAGE_CONTENT_SID: "HXurgent",
    VERCEL_ENV: "production",
  });

  assert.equal(health.invitations.ready, true);
  assert.equal(health.twilio.ready, true);
  assert.equal(health.dispatcher.ready, true);
  assert.equal(health.deployment.ready, true);
});

test("environment health never includes secret values", () => {
  const secret = "do-not-display";
  const health = evaluateEnvironment({ SUPABASE_SECRET_KEY: secret });
  assert.equal(JSON.stringify(health).includes(secret), false);
  assert.equal(health.invitations.ready, false);
});

test("church settings validation normalizes values", () => {
  const result = validateChurchSettings({
    churchName: "  Flock Church  ",
    timezone: "Africa/Lagos",
    careMessageSignature: " TREM Flock ",
    contactEmail: " OFFICE@EXAMPLE.COM ",
    contactPhone: "+2348012345678",
  });
  assert.equal(result.value?.churchName, "Flock Church");
  assert.equal(result.value?.contactEmail, "office@example.com");
});

test("test phone requires international format", () => {
  assert.equal(validateTestPhone("whatsapp:+2348012345678"), "+2348012345678");
  assert.equal(validateTestPhone("08012345678"), null);
});
