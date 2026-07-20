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
      <AuthNotice error={params.error} message={params.message} />
      <form action={requestPasswordReset} className="space-y-5">
        <label className="block text-sm font-medium text-[#34415f]">Email address<input className={inputClass} name="email" type="email" required autoComplete="email" /></label>
        <AuthSubmitButton idleLabel="Send reset link" pendingLabel="Sending reset link..." />
      </form>
      <Link href="/sign-in" className="mt-7 block text-center text-sm font-semibold text-[#4f7df3]">Back to sign in</Link>
    </AuthShell>
  );
}
