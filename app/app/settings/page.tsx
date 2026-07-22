import { FormSubmitButton } from "@/components/form-submit-button";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { PageHeader, StatusBadge } from "@/components/workspace-ui";
import { requireSuperAdmin } from "@/lib/admin";
import { evaluateEnvironment } from "@/lib/system-health";
import { createClient } from "@/lib/supabase/server";
import { sendSystemTestMessage, updateChurchSettings } from "./actions";

export const metadata = {
  title: "Settings and system health",
  description: "Manage church identity and review Flock integration health.",
};

type ChurchSettings = {
  church_name: string;
  timezone: string;
  care_message_signature: string;
  contact_email: string | null;
  contact_phone: string | null;
  updated_at: string;
};

type JobRun = {
  status: "running" | "succeeded" | "failed";
  processed_count: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
};

type FailedEvent = {
  id: string;
  event_type: string;
  error_message: string | null;
  created_at: string;
  workers: { full_name: string } | null;
};

const timezones = [
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Johannesburg",
  "Europe/London",
  "America/New_York",
];

function displayTime(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function HealthRow({ label, ready, detail }: { label: string; ready: boolean; detail: string }) {
  return (
    <li className="flex flex-col gap-3 border-b border-[var(--color-border)] py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 pr-4">
        <p className="text-sm font-semibold text-[var(--color-text)]">{label}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{detail}</p>
      </div>
      <StatusBadge tone={ready ? "success" : "warning"}>{ready ? "Ready" : "Needs attention"}</StatusBadge>
    </li>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const [settingsResult, jobResult, failuresResult] = await Promise.all([
    supabase
      .from("church_settings")
      .select("church_name, timezone, care_message_signature, contact_email, contact_phone, updated_at")
      .eq("id", "00000000-0000-4000-8000-000000000001")
      .maybeSingle(),
    supabase
      .from("system_job_runs")
      .select("status, processed_count, error_message, started_at, completed_at")
      .eq("job_name", "followup_dispatcher")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("followup_events")
      .select("id, event_type, error_message, created_at, workers(full_name)")
      .eq("delivery_status", "failed")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const environment = evaluateEnvironment(process.env);
  const settings = settingsResult.data as ChurchSettings | null;
  const lastJob = jobResult.data as JobRun | null;
  const failedEvents = (failuresResult.data ?? []) as unknown as FailedEvent[];
  const databaseReady = !settingsResult.error && Boolean(settings);
  const dispatcherHealthy = environment.dispatcher.ready
    && !jobResult.error
    && Boolean(lastJob)
    && lastJob?.status === "succeeded";
  const pageError = params.error
    ?? (settingsResult.error ? "Run the latest Supabase migration to activate Settings." : undefined);

  return (
    <div className="mx-auto max-w-7xl">
      <WorkspaceNotice message={params.message} error={pageError} />
      <PageHeader
        eyebrow="Administration"
        title="Settings and system health"
        description="Keep church identity details current and confirm that Flock's protected services are ready for ministry operations."
        actions={<StatusBadge tone={databaseReady && environment.invitations.ready ? "success" : "warning"}>{databaseReady && environment.invitations.ready ? "Core systems ready" : "Review required"}</StatusBadge>}
      />

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">Church profile</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Identity and contact details</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">These values provide one reliable source for future reports, messages, and branded documents.</p>
          </div>

          <form action={updateChurchSettings} className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--color-text-secondary)] sm:col-span-2">Church name<input name="church_name" required minLength={2} maxLength={120} defaultValue={settings?.church_name ?? "Flock Church"} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Timezone<select name="timezone" defaultValue={settings?.timezone ?? "Africa/Lagos"} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal">{timezones.map((timezone) => <option key={timezone}>{timezone}</option>)}</select></label>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Message signature<input name="care_message_signature" required minLength={2} maxLength={80} defaultValue={settings?.care_message_signature ?? "TREM Flock"} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Contact email<input type="email" name="contact_email" defaultValue={settings?.contact_email ?? ""} placeholder="office@example.com" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Contact phone<input type="tel" name="contact_phone" defaultValue={settings?.contact_phone ?? ""} placeholder="+2348012345678" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /><span className="mt-1.5 block text-xs font-normal text-[var(--color-text-muted)]">Use international format.</span></label>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <FormSubmitButton pendingLabel="Saving settings..." disabled={!databaseReady} className="min-h-12 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Save settings</FormSubmitButton>
              {settings?.updated_at && <p className="text-xs text-[var(--color-text-muted)]">Last saved {displayTime(settings.updated_at)}</p>}
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">Configuration</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Integration readiness</h2>
          <ul className="mt-3">
            <HealthRow label="Database migration" ready={databaseReady} detail={databaseReady ? "Settings tables and access policies are available." : "The latest system-settings migration has not been detected."} />
            <HealthRow label="Managed invitations" {...environment.invitations} />
            <HealthRow label="WhatsApp delivery" {...environment.twilio} />
            <HealthRow label="Public callback URL" {...environment.appUrl} />
            <HealthRow label="Vercel deployment" {...environment.deployment} />
          </ul>
          <p className="mt-4 rounded-2xl bg-[var(--color-surface-subtle)] px-4 py-3 text-xs leading-5 text-[var(--color-text-muted)]">For security, this page reports whether variables exist but never displays secret values.</p>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">Automation</p><h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Follow-up dispatcher</h2></div>
            <StatusBadge tone={dispatcherHealthy ? "success" : "warning"}>{dispatcherHealthy ? "Healthy" : "Check setup"}</StatusBadge>
          </div>
          {lastJob ? (
            <dl className="mt-5 grid grid-cols-2 gap-4 rounded-2xl bg-[var(--color-surface-subtle)] p-4 text-sm">
              <div><dt className="text-xs text-[var(--color-text-muted)]">Last run</dt><dd className="mt-1 font-semibold text-[var(--color-text)]">{displayTime(lastJob.completed_at ?? lastJob.started_at)}</dd></div>
              <div><dt className="text-xs text-[var(--color-text-muted)]">Result</dt><dd className="mt-1 font-semibold capitalize text-[var(--color-text)]">{lastJob.status}</dd></div>
              <div><dt className="text-xs text-[var(--color-text-muted)]">Processed</dt><dd className="mt-1 font-semibold text-[var(--color-text)]">{lastJob.processed_count}</dd></div>
              <div><dt className="text-xs text-[var(--color-text-muted)]">Protected endpoint</dt><dd className="mt-1 font-semibold text-[var(--color-text)]">{environment.dispatcher.ready ? "Configured" : "Incomplete"}</dd></div>
              {lastJob.error_message && <div className="col-span-2"><dt className="text-xs text-[var(--color-text-muted)]">Last error</dt><dd className="mt-1 break-words text-xs text-[var(--color-danger)]">{lastJob.error_message}</dd></div>}
            </dl>
          ) : <p className="mt-5 rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-6 text-sm leading-6 text-[var(--color-text-muted)]">No dispatcher heartbeat has been recorded. After applying the migration, run the protected cron endpoint once.</p>}
        </section>

        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">Controlled check</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Send a WhatsApp test</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Send the approved soft-message template to a number you control. Standard Twilio charges may apply.</p>
          <form action={sendSystemTestMessage} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-semibold text-[var(--color-text-secondary)]">Test phone<input type="tel" name="test_phone" required placeholder="+2348012345678" defaultValue={settings?.contact_phone ?? ""} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
            <FormSubmitButton pendingLabel="Sending..." disabled={!environment.twilio.ready} className="min-h-12 rounded-xl bg-[var(--color-primary-soft)] px-5 text-sm font-semibold text-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-50">Send test</FormSubmitButton>
          </form>
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">Delivery review</p><h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Recent WhatsApp failures</h2></div><StatusBadge tone={failedEvents.length ? "danger" : "success"}>{failedEvents.length ? `${failedEvents.length} recent` : "No recent failures"}</StatusBadge></div>
        {failedEvents.length ? <div className="mt-5 divide-y divide-[var(--color-border)]">{failedEvents.map((event) => <article key={event.id} className="grid gap-2 py-4 sm:grid-cols-[minmax(180px,0.7fr)_minmax(0,1.3fr)_auto] sm:items-center"><div><p className="text-sm font-semibold text-[var(--color-text)]">{event.workers?.full_name ?? "Unknown worker"}</p><p className="mt-1 text-xs capitalize text-[var(--color-text-muted)]">{event.event_type.replaceAll("_", " ")}</p></div><p className="break-words text-xs leading-5 text-[var(--color-danger)]">{event.error_message ?? "Twilio did not provide an error message."}</p><time className="text-xs text-[var(--color-text-muted)]">{displayTime(event.created_at)}</time></article>)}</div> : <p className="mt-5 rounded-2xl bg-[#edf7f1] px-4 py-4 text-sm text-[#347457]">No failed delivery events are currently recorded.</p>}
        {failuresResult.error && <p className="mt-4 text-xs text-[var(--color-danger)]">Delivery history could not be loaded: {failuresResult.error.message}</p>}
      </section>
    </div>
  );
}
