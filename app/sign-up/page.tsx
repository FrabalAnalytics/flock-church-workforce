import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { AuthNotice, inputClass } from "@/components/auth-form";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { signUp } from "@/app/auth/actions";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <AuthShell eyebrow="Join your team" title="Create your account" description="Your church administrator will approve your role and department after signup.">
      <AuthNotice error={params.error} />
      <form action={signUp} className="space-y-4">
        <label className="block text-sm font-medium text-[#34415f]">Full name<input className={inputClass} name="full_name" required autoComplete="name" /></label>
        <label className="block text-sm font-medium text-[#34415f]">Phone number <span className="font-normal text-[#929bad]">(optional)</span><input className={inputClass} name="phone_number" type="tel" autoComplete="tel" /></label>
        <label className="block text-sm font-medium text-[#34415f]">Email address<input className={inputClass} name="email" type="email" required autoComplete="email" /></label>
        <label className="block text-sm font-medium text-[#34415f]">Password<input className={inputClass} name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
        <label className="block text-sm font-medium text-[#34415f]">Confirm password<input className={inputClass} name="confirm_password" type="password" minLength={8} required autoComplete="new-password" /></label>
        <p className="text-xs leading-5 text-[#858fa3]">By creating an account, you acknowledge Flock&apos;s <Link href="/privacy" className="font-semibold text-[#4f7df3]">Privacy Notice</Link>.</p>
        <AuthSubmitButton idleLabel="Request access" pendingLabel="Creating account..." />
      </form>
      <p className="mt-7 text-center text-sm text-[#758097]">Already have an account? <Link href="/sign-in" className="font-semibold text-[#4f7df3]">Sign in</Link></p>
    </AuthShell>
  );
}
