type AppOriginInput = {
  configuredOrigin?: string;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
  host?: string | null;
  production?: boolean;
};

function firstHeaderValue(value?: string | null) {
  return value?.split(",", 1)[0]?.trim() || null;
}

function validConfiguredOrigin(value: string | undefined, production: boolean) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    if (production && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function resolveAppOrigin({
  configuredOrigin,
  forwardedHost,
  forwardedProto,
  host,
  production = false,
}: AppOriginInput) {
  const configured = validConfiguredOrigin(configuredOrigin, production);
  if (configured) return configured;

  const requestHost = firstHeaderValue(forwardedHost) ?? firstHeaderValue(host);
  if (!requestHost || requestHost.length > 253 || /[\s/\\@]/.test(requestHost)) return null;
  const forwardedProtocol = firstHeaderValue(forwardedProto)?.toLowerCase();
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https"
    ? forwardedProtocol
    : production ? "https" : "http";
  if (production && protocol !== "https") return null;

  try {
    const url = new URL(`${protocol}://${requestHost}`);
    return url.host === requestHost ? url.origin : null;
  } catch {
    return null;
  }
}
