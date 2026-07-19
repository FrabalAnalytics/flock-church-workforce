import { AuthShell } from "@/components/auth-shell";
import { AuthNotice, buttonClass, inputClass } from "@/components/auth-form";
import { updatePassword } from "@/app/auth/actions";

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <AuthShell eyebrow="Secure your account" title="Choose a new password" description="Use at least 8 characters and keep this password private.">
      <AuthNotice error={params.error} />
      <form action={updatePassword} className="space-y-5">
        <label className="block text-sm font-medium text-[#34415f]">New password<input className={inputClass} name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
        <label className="block text-sm font-medium text-[#34415f]">Confirm password<input className={inputClass} name="confirm_password" type="password" minLength={8} required autoComplete="new-password" /></label>
        <button className={buttonClass} type="submit">Update password</button>
      </form>
    </AuthShell>
  );
}
