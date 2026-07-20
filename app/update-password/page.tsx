import { AuthShell } from "@/components/auth-shell";
import { AuthNotice, inputClass } from "@/components/auth-form";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { updatePassword } from "@/app/auth/actions";

export const metadata = { title: "Choose a new password", description: "Securely update your Flock account password.", robots: { index: false, follow: false } };

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <AuthShell eyebrow="Secure your account" title="Choose a new password" description="Use at least 8 characters and keep this password private.">
      <AuthNotice error={params.error} />
      <form action={updatePassword} className="space-y-5">
        <label className="block text-sm font-medium text-[#34415f]">New password<input className={inputClass} name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
        <label className="block text-sm font-medium text-[#34415f]">Confirm password<input className={inputClass} name="confirm_password" type="password" minLength={8} required autoComplete="new-password" /></label>
        <AuthSubmitButton idleLabel="Update password" pendingLabel="Updating password..." />
      </form>
    </AuthShell>
  );
}
