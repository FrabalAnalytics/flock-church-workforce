import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { AuthNotice, inputClass } from "@/components/auth-form";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { signIn } from "@/app/auth/actions";

export const metadata = { title: "Sign in", description: "Sign in to your approved Flock church account.", robots: { index: false, follow: false } };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell eyebrow="Welcome back" title="Sign in to Flock" description="Use your approved church account to continue.">
      <AuthNotice error={params.error} message={params.message} />
      <form action={signIn} className="space-y-5">
        <input type="hidden" name="next" value={params.next ?? "/app"} />
        <label className="block text-sm font-medium text-[#34415f]">
          Email address
          <input className={inputClass} name="email" type="email" autoComplete="email" required placeholder="you@church.org" />
        </label>
        <label className="block text-sm font-medium text-[#34415f]">
          Password
          <input className={inputClass} name="password" type="password" autoComplete="current-password" required placeholder="Enter your password" />
        </label>
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm font-semibold text-[#4f7df3] hover:text-[#365fc7]">Forgot password?</Link>
        </div>
        <AuthSubmitButton idleLabel="Sign in" pendingLabel="Signing in..." />
      </form>
      <p className="mt-7 text-center text-sm text-[#758097]">
        Need an account?{" "}
        <Link href="/sign-up" className="font-semibold text-[#4f7df3]">Request access</Link>
      </p>
    </AuthShell>
  );
}
