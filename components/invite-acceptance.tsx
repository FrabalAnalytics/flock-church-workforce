"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";

export function InviteAcceptance() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function acceptInvitation() {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const providerError = hash.get("error_description") ?? url.searchParams.get("error_description");
      if (providerError) {
        if (active) setError(providerError);
        return;
      }

      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");
      if (code || (tokenHash && type)) {
        const callback = new URL("/auth/callback", url.origin);
        if (code) callback.searchParams.set("code", code);
        if (tokenHash) callback.searchParams.set("token_hash", tokenHash);
        if (type) callback.searchParams.set("type", type);
        callback.searchParams.set("next", "/update-password");
        window.location.replace(callback.toString());
        return;
      }

      const supabase = createClient();
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) {
          if (active) setError(sessionError.message);
          return;
        }
        router.replace("/update-password");
        router.refresh();
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        if (active) setError(sessionError?.message ?? "This invitation link is invalid or has expired.");
        return;
      }
      router.replace("/update-password");
      router.refresh();
    }

    void acceptInvitation();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <AuthShell eyebrow="Workspace invitation" title={error ? "Invitation unavailable" : "Accepting your invitation"} description={error ? "The invitation could not create a secure session." : "Please wait while Flock verifies your invitation securely."}>
      {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{error} <a href="/sign-in" className="mt-3 block font-semibold underline">Return to sign in</a></div> : <div role="status" className="flex items-center gap-3 rounded-2xl border border-[#cbd8fb] bg-[#eef3ff] px-4 py-4 text-sm text-[#3458b0]"><span className="h-5 w-5 animate-spin rounded-full border-2 border-[#9db2ea] border-t-[#4f7df3]" aria-hidden="true" />Verifying invitation…</div>}
    </AuthShell>
  );
}
