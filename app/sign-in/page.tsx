import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { AuthNotice, inputClass } from "@/components/auth-form";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { PasswordField } from "@/components/password-field";
import { signIn } from "@/app/auth/actions";

export const metadata = {
  title: "Sign in — Flock Ministry Operations",
  description: "Access your approved church operational workspace and role-based dashboard.",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell
      eyebrow="Leadership Portal"
      title="Sign in to Flock"
      description="Access your approved church operational workspace and department dashboard."
    >
      <AuthNotice error={params.error} message={params.message} />

      <form action={signIn} className="space-y-5">
        <input type="hidden" name="next" value={params.next ?? "/app"} />

        <label className="block text-sm font-medium text-[#34415f]">
          Work email address
          <input
            className={inputClass}
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="admin@yourchurch.org"
          />
        </label>

        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
          />
          <div className="mt-2 text-right">
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#4f7df3] hover:text-[#365fc7] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <AuthSubmitButton idleLabel="Sign in to Workspace" pendingLabel="Authenticating..." />
      </form>

      <div className="mt-8 border-t border-[#e8edf8] pt-6 text-center text-sm text-[#758097]">
        <p>
          Need access for your ministry or church?{" "}
          <Link href="/sign-up" className="font-semibold text-[#4f7df3] hover:text-[#365fc7] transition-colors">
            Request workspace access
          </Link>
        </p>
        <p className="mt-3 text-xs text-[#9099ac]">
          Account provisioning and permissions are governed by your church&apos;s Super Administrator.
        </p>
      </div>
    </AuthShell>
  );
}
