import { AuthShell } from "@/components/auth-shell";
import { AuthNotice } from "@/components/auth-form";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { PasswordField } from "@/components/password-field";
import { updatePassword } from "@/app/auth/actions";

export const metadata = { title: "Choose a new password", description: "Securely update your Flock account password.", robots: { index: false, follow: false } };

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <AuthShell eyebrow="Secure your account" title="Choose a new password" description="Use at least 8 characters and keep this password private.">
      <AuthNotice error={params.error} />
      <form action={updatePassword} className="space-y-5">
        <PasswordField label="New password" name="password" autoComplete="new-password" minLength={8} hint="Use at least 8 characters and avoid a password used on another account." />
        <PasswordField label="Confirm password" name="confirm_password" autoComplete="new-password" minLength={8} />
        <AuthSubmitButton idleLabel="Update password" pendingLabel="Updating password..." />
      </form>
    </AuthShell>
  );
}
