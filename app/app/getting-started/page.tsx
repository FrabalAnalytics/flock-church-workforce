import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/workspace-ui";
import { requireSuperAdmin } from "@/lib/admin";
import { buildOnboardingSteps, onboardingProgress } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Getting started",
  description: "Complete the essential Flock setup steps for your church.",
};

export default async function GettingStartedPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const [settings, departments, administrators, workers, submissions] = await Promise.all([
    supabase
      .from("church_settings")
      .select("church_name, contact_email, contact_phone")
      .eq("id", "00000000-0000-4000-8000-000000000001")
      .maybeSingle(),
    supabase.from("departments").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "super_admin"),
    supabase.from("workers").select("*", { count: "exact", head: true }).eq("status", "Active"),
    supabase.from("attendance_submissions").select("*", { count: "exact", head: true }),
  ]);
  const profile = settings.data;
  const profileReady = Boolean(
    profile
      && profile.church_name?.trim()
      && (profile.contact_email?.trim() || profile.contact_phone?.trim()),
  );
  const steps = buildOnboardingSteps({
    churchProfileReady: profileReady,
    departmentCount: departments.count ?? 0,
    superAdminCount: administrators.count ?? 0,
    activeWorkerCount: workers.count ?? 0,
    attendanceSubmissionCount: submissions.count ?? 0,
  });
  const progress = onboardingProgress(steps);
  const loadError = settings.error
    ?? departments.error
    ?? administrators.error
    ?? workers.error
    ?? submissions.error;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Super Admin guide"
        title="Getting started"
        description="Prepare Flock for reliable weekly use. Progress updates automatically from the records already in your workspace."
        actions={<StatusBadge tone={progress.percentage === 100 ? "success" : "info"}>{progress.completed} of {progress.total} complete</StatusBadge>}
      />

      {loadError && <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Some setup progress could not be loaded: {loadError.message}</p>}

      <section className="mt-7 rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-sm font-semibold text-[var(--color-text)]">Workspace readiness</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">Complete the remaining steps in any order.</p></div>
          <p className="text-2xl font-semibold text-[var(--color-primary)]">{progress.percentage}%</p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--color-primary-soft)]" role="progressbar" aria-label="Onboarding progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percentage}>
          <div className="h-full rounded-full bg-[var(--color-primary)] transition-[width]" style={{ width: `${progress.percentage}%` }} />
        </div>
      </section>

      <ol className="mt-6 space-y-4">
        {steps.map((step, index) => (
          <li key={step.key} className={`rounded-3xl border bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6 ${step.complete ? "border-[#cfe8d8]" : "border-[var(--color-border)]"}`}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${step.complete ? "bg-[#edf7f1] text-[#347457]" : "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"}`}>{step.complete ? "✓" : index + 1}</span>
                <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-[var(--color-text)]">{step.title}</h2>{step.complete && <StatusBadge tone="success">Complete</StatusBadge>}</div><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">{step.description}</p></div>
              </div>
              <Link href={step.href} className="flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-5 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]">{step.action}</Link>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-6 rounded-3xl border border-[#d9e3fb] bg-[#f4f7ff] p-5 sm:p-6">
        <h2 className="font-semibold text-[#304d91]">Protect the records you have created</h2>
        <p className="mt-2 text-sm leading-6 text-[#49608f]">Download a full backup after major imports and at least once each month. The file contains personal information, so keep it in a restricted, encrypted location.</p>
        <a href="/api/admin/backup" download className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#4f7df3] px-5 text-sm font-semibold text-white">Download full backup</a>
      </section>
    </div>
  );
}
