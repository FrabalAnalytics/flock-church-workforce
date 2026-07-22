export type HealthTone = "success" | "warning" | "danger";

export type EnvironmentHealth = {
  appUrl: { ready: boolean; detail: string };
  invitations: { ready: boolean; detail: string };
  twilio: { ready: boolean; detail: string };
  dispatcher: { ready: boolean; detail: string };
  deployment: { ready: boolean; detail: string };
};

function configured(environment: NodeJS.ProcessEnv, names: string[]) {
  return names.every((name) => Boolean(environment[name]?.trim()));
}

export function evaluateEnvironment(environment: NodeJS.ProcessEnv): EnvironmentHealth {
  const appUrl = environment.NEXT_PUBLIC_APP_URL?.trim();
  const validAppUrl = Boolean(appUrl && /^https:\/\//i.test(appUrl));
  const supabaseServerReady = configured(environment, [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ]) && Boolean(
    environment.SUPABASE_SECRET_KEY?.trim()
      || environment.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
  const twilioReady = configured(environment, [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_WHATSAPP_FROM",
    "TWILIO_SOFT_MESSAGE_CONTENT_SID",
    "TWILIO_URGENT_MESSAGE_CONTENT_SID",
  ]);
  const cronReady = Boolean(environment.CRON_SECRET?.trim());

  return {
    appUrl: {
      ready: validAppUrl,
      detail: validAppUrl
        ? new URL(appUrl!).origin
        : "Set NEXT_PUBLIC_APP_URL to the production HTTPS origin.",
    },
    invitations: {
      ready: supabaseServerReady && validAppUrl,
      detail: supabaseServerReady && validAppUrl
        ? "Managed invitations are configured."
        : "Supabase server credentials and the public app URL are required.",
    },
    twilio: {
      ready: twilioReady && validAppUrl,
      detail: twilioReady && validAppUrl
        ? "WhatsApp credentials, templates, and callback URL are configured."
        : "One or more Twilio WhatsApp settings are missing.",
    },
    dispatcher: {
      ready: cronReady && twilioReady,
      detail: cronReady && twilioReady
        ? "The protected follow-up dispatcher is configured."
        : "CRON_SECRET and all Twilio settings are required.",
    },
    deployment: {
      ready: Boolean(environment.VERCEL || environment.VERCEL_ENV),
      detail: environment.VERCEL_ENV
        ? `Running in the ${environment.VERCEL_ENV} Vercel environment.`
        : "Local environment; deployment metadata is unavailable.",
    },
  };
}

export type ChurchSettingsInput = {
  churchName: string;
  timezone: string;
  careMessageSignature: string;
  contactEmail: string;
  contactPhone: string;
};

export function validateChurchSettings(input: ChurchSettingsInput) {
  const value = {
    churchName: input.churchName.trim(),
    timezone: input.timezone.trim(),
    careMessageSignature: input.careMessageSignature.trim(),
    contactEmail: input.contactEmail.trim().toLowerCase(),
    contactPhone: input.contactPhone.trim(),
  };

  if (value.churchName.length < 2 || value.churchName.length > 120) {
    return { error: "Church name must be between 2 and 120 characters." } as const;
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone: value.timezone }).format();
  } catch {
    return { error: "Select a supported church timezone." } as const;
  }
  if (value.careMessageSignature.length < 2 || value.careMessageSignature.length > 80) {
    return { error: "Message signature must be between 2 and 80 characters." } as const;
  }
  if (value.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.contactEmail)) {
    return { error: "Enter a valid contact email address." } as const;
  }
  if (value.contactPhone && !/^\+[1-9]\d{7,14}$/.test(value.contactPhone)) {
    return { error: "Enter the contact phone in international format, such as +2348012345678." } as const;
  }

  return { value } as const;
}

export function validateTestPhone(phone: string) {
  const normalized = phone.trim().replace(/^whatsapp:/i, "");
  return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null;
}
