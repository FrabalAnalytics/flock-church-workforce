import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { AuthNotice, buttonClass, inputClass } from "@/components/auth-form";
import { requestPasswordReset } from "@/app/auth/actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  return (
    <AuthShell eyebrow="Account recovery" title="Reset your password" description="We will email you a secure link to choose a new password.">
      <AuthNotice error={params.error} message={params.message} />
      <form action={requestPasswordReset} className="space-y-5">
        <label className="block text-sm font-medium text-[#34415f]">Email address<input className={inputClass} name="email" type="email" required autoComplete="email" /></label>
        <button className={buttonClass} type="submit">Send reset link</button>
      </form>
      <Link href="/sign-in" className="mt-7 block text-center text-sm font-semibold text-[#4f7df3]">Back to sign in</Link>
    </AuthShell>
  );
}
