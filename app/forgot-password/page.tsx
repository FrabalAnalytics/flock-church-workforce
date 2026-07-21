import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { AuthNotice, inputClass } from "@/components/auth-form";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { requestPasswordReset } from "@/app/auth/actions";

export const metadata = { title: "Reset password", description: "Request a secure Flock password-reset link.", robots: { index: false, follow: false } };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  return (
    <AuthShell eyebrow="Account recovery" title="Reset your password" description="We will email you a secure link to choose a new password.">
      <AuthNotice error={params.error} />
      {params.message ? (
        <section className="rounded-3xl border border-[#d7e4db] bg-[#f5faf7] p-5 sm:p-6" aria-labelledby="reset-link-sent">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e3f2e8] text-[#347457]"><svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.8"><path d="m5 12 4 4L19 6" /></svg></div>
          <h2 id="reset-link-sent" className="mt-4 text-lg font-semibold text-[#294b35]">Check your email</h2>
          <p className="mt-2 text-sm leading-6 text-[#668071]">If the address belongs to a Flock account, its secure reset link should arrive shortly. Check your spam folder before requesting another one.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="/sign-in" className="flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)]">Return to sign in</Link>
            <Link href="/forgot-password" className="flex min-h-12 items-center justify-center rounded-xl border border-[#d7e4db] bg-white px-5 text-sm font-semibold text-[#42614d] hover:bg-[#eef7f1]">Send another link</Link>
          </div>
        </section>
      ) : (
        <>
          <form action={requestPasswordReset} className="space-y-5">
            <label className="block text-sm font-medium text-[#34415f]">Email address<input className={inputClass} name="email" type="email" required autoComplete="email" placeholder="you@church.org" /></label>
            <AuthSubmitButton idleLabel="Send reset link" pendingLabel="Sending reset link..." />
          </form>
          <Link href="/sign-in" className="mt-7 block text-center text-sm font-semibold text-[#4f7df3]">Back to sign in</Link>
        </>
      )}
    </AuthShell>
  );
}
