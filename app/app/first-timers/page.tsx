import Link from "next/link";
import { redirect } from "next/navigation";
import { registerFirstTimer } from "@/app/app/first-timers/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { EmptyState, MetricPill, PageHeader, StatusBadge } from "@/components/workspace-ui";
import { requireProfile } from "@/lib/auth";
import { firstTimerStageLabels, firstTimerStages, serviceTypes, type FirstTimerStage } from "@/lib/first-timers";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "First timers", description: "Register first timers and coordinate their follow-up journey." };

type FirstTimerRow = {
  id: string;
  full_name: string;
  phone_number: string;
  preferred_contact: string;
  consent_to_contact: boolean;
  first_visit_date: string;
  first_service_type: string;
  journey_stage: FirstTimerStage;
  assigned_to: string | null;
  next_followup_at: string | null;
  last_contacted_at: string | null;
  created_at: string;
  first_timer_visits: Array<{ id: string }>;
};

const managerRoles = new Set(["super_admin", "church_leader", "first_timer_coordinator"]);

function lagosDate() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function displayDateTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(value));
}

function stageTone(stage: FirstTimerStage): "neutral" | "info" | "success" | "warning" | "danger" {
  if (stage === "integrated") return "success";
  if (stage === "closed") return "neutral";
  if (stage === "new") return "warning";
  if (stage === "connected" || stage === "returned") return "info";
  return "neutral";
}

export default async function FirstTimersPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string; q?: string; stage?: string; assignment?: string }>;
}) {
  const { profile } = await requireProfile();
  if (!managerRoles.has(profile.role)) redirect("/app");
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data, error }, { data: coordinators }] = await Promise.all([
    supabase
      .from("first_timers")
      .select("id, full_name, phone_number, preferred_contact, consent_to_contact, first_visit_date, first_service_type, journey_stage, assigned_to, next_followup_at, last_contacted_at, created_at, first_timer_visits(id)")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("profiles").select("id, full_name").eq("role", "first_timer_coordinator").order("full_name"),
  ]);
  const allRows = (data ?? []) as unknown as FirstTimerRow[];
  const coordinatorNames = new Map((coordinators ?? []).map((coordinator) => [coordinator.id, coordinator.full_name]));
  const now = new Date();
  const activeRows = allRows.filter((row) => !["integrated", "closed"].includes(row.journey_stage));
  const dueRows = activeRows.filter((row) => row.next_followup_at && new Date(row.next_followup_at) <= now);
  const normalizedSearch = params.q?.trim().toLowerCase();
  const rows = allRows.filter((row) => {
    const searchMatch = !normalizedSearch || row.full_name.toLowerCase().includes(normalizedSearch) || row.phone_number.toLowerCase().includes(normalizedSearch);
    const stageMatch = !params.stage || row.journey_stage === params.stage;
    const assignmentMatch = !params.assignment
      || (params.assignment === "mine" && row.assigned_to === profile.id)
      || (params.assignment === "unassigned" && !row.assigned_to)
      || row.assigned_to === params.assignment;
    return searchMatch && stageMatch && assignmentMatch;
  });
  const hasFilters = Boolean(params.q || params.stage || params.assignment);

  return (
    <div className="mx-auto max-w-7xl">
      <WorkspaceNotice message={params.message} error={params.error ?? error?.message} />
      <PageHeader
        eyebrow="Newcomer care"
        title="First timers"
        description="Register visitors manually, assign coordinator follow-up and guide each person through a respectful connection journey."
        actions={<a href="#register-first-timer" className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] sm:w-auto">Register first timer</a>}
      />

      <div className="mt-6 flex flex-wrap gap-2">
        <MetricPill value={allRows.length} label="registered" />
        <MetricPill value={activeRows.length} label="active journeys" />
        <MetricPill value={allRows.filter((row) => row.journey_stage === "new").length} label="new" tone="warning" />
        <MetricPill value={dueRows.length} label="follow-ups due" tone={dueRows.length ? "danger" : "neutral"} />
        <MetricPill value={allRows.filter((row) => row.journey_stage === "integrated").length} label="integrated" />
      </div>

      <details id="register-first-timer" className="mt-7 scroll-mt-24 overflow-hidden rounded-3xl border border-[#d9e3fb] bg-white shadow-[var(--shadow-sm)]">
        <summary className="cursor-pointer list-none bg-[#f4f7ff] px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold text-[#304d91]">Manual first-timer registration</h2><p className="mt-1 text-xs leading-5 text-[#687ba4]">Use the visitor&apos;s phone number to prevent duplicate journeys. Optional details can be completed later.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)]">Welcome desk</span></div>
        </summary>
        <form action={registerFirstTimer} className="p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Full name <span className="text-[var(--color-danger)]">Required</span><input name="full_name" required minLength={2} maxLength={120} autoComplete="name" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Phone number <span className="text-[var(--color-danger)]">Required</span><input name="phone_number" type="tel" required minLength={7} maxLength={40} autoComplete="tel" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Email <span className="font-normal text-[var(--color-text-muted)]">Optional</span><input name="email" type="email" maxLength={254} autoComplete="email" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Location <span className="font-normal text-[var(--color-text-muted)]">Optional</span><input name="location" maxLength={160} placeholder="Area or neighbourhood" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal" /></label>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">First visit date<input name="first_visit_date" type="date" required max={lagosDate()} defaultValue={lagosDate()} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm font-normal" /></label>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Service<select name="first_service_type" required className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal">{serviceTypes.map((service) => <option key={service}>{service}</option>)}</select></label>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Assign coordinator<select name="assigned_to" defaultValue="" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal"><option value="">Leave unassigned</option>{coordinators?.map((coordinator) => <option key={coordinator.id} value={coordinator.id}>{coordinator.full_name}</option>)}</select></label>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Next follow-up <span className="font-normal text-[var(--color-text-muted)]">Optional</span><input name="next_followup_at" type="datetime-local" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm font-normal" /></label>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">How they heard about us <span className="font-normal text-[var(--color-text-muted)]">Optional</span><input name="how_heard" maxLength={240} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal" /></label>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Interests <span className="font-normal text-[var(--color-text-muted)]">Optional</span><input name="interests" maxLength={500} placeholder="Small group, music, children..." className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal" /></label>
            <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Preferred contact<select name="preferred_contact" defaultValue="phone" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal"><option value="phone">Phone call</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">Email</option><option value="none">No contact</option></select></label>
          </div>
          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-[#dbe8df] bg-[#f4faf6] p-4 text-sm leading-6 text-[#3f654d]"><input name="consent_to_contact" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--color-primary)]" /><span><strong className="font-semibold">Contact consent confirmed.</strong> The visitor agreed that the church may contact them for welcome and follow-up. Leave unchecked if consent was not given.</span></label>
          <div className="mt-5 flex justify-end"><FormSubmitButton pendingLabel="Registering..." className="min-h-12 w-full rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60 sm:w-auto">Register first timer</FormSubmitButton></div>
        </form>
      </details>

      <form className="mt-7 rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_auto_auto] xl:items-end">
          <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Search<input name="q" defaultValue={params.q} placeholder="Name or phone number" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal" /></label>
          <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Journey stage<select name="stage" defaultValue={params.stage ?? ""} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal"><option value="">All stages</option>{firstTimerStages.map((stage) => <option key={stage} value={stage}>{firstTimerStageLabels[stage]}</option>)}</select></label>
          <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Assignment<select name="assignment" defaultValue={params.assignment ?? ""} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal"><option value="">Everyone</option><option value="mine">Assigned to me</option><option value="unassigned">Unassigned</option>{coordinators?.map((coordinator) => <option key={coordinator.id} value={coordinator.id}>{coordinator.full_name}</option>)}</select></label>
          <button className="min-h-12 rounded-xl bg-[var(--color-primary-soft)] px-5 text-sm font-semibold text-[var(--color-primary-strong)]">Apply</button>
          {hasFilters && <Link href="/app/first-timers" className="flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-border)] px-5 text-sm font-semibold text-[var(--color-text-secondary)]">Clear</Link>}
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between gap-3"><p className="text-sm text-[var(--color-text-secondary)]"><strong className="text-[var(--color-text)]">{rows.length}</strong> first timer{rows.length === 1 ? "" : "s"}</p>{hasFilters && <StatusBadge tone="info">Filtered</StatusBadge>}</div>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        {rows.length ? rows.map((row) => {
          const overdue = row.next_followup_at && new Date(row.next_followup_at) <= now && !["integrated", "closed"].includes(row.journey_stage);
          return <Link key={row.id} href={`/app/first-timers/${row.id}`} className={`group rounded-3xl border bg-white p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] sm:p-6 ${overdue ? "border-[#efc1bd]" : "border-[var(--color-border)]"}`}>
            <div className="flex items-start justify-between gap-4"><div className="min-w-0"><h2 className="truncate text-lg font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary-strong)]">{row.full_name}</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{row.phone_number}</p></div><StatusBadge tone={overdue ? "danger" : stageTone(row.journey_stage)}>{overdue ? "Follow-up overdue" : firstTimerStageLabels[row.journey_stage]}</StatusBadge></div>
            <div className="mt-5 grid gap-3 text-xs text-[var(--color-text-muted)] sm:grid-cols-2"><p><span className="font-semibold text-[var(--color-text-secondary)]">First visit:</span> {displayDate(row.first_visit_date)}</p><p><span className="font-semibold text-[var(--color-text-secondary)]">Visits:</span> {row.first_timer_visits.length}</p><p><span className="font-semibold text-[var(--color-text-secondary)]">Coordinator:</span> {row.assigned_to ? coordinatorNames.get(row.assigned_to) ?? "Assigned team member" : "Unassigned"}</p><p><span className="font-semibold text-[var(--color-text-secondary)]">Consent:</span> {row.consent_to_contact ? `${row.preferred_contact}` : "No contact consent"}</p></div>
            {row.next_followup_at && <p className={`mt-4 rounded-xl px-3 py-2 text-xs font-semibold ${overdue ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]" : "bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]"}`}>Next follow-up: {displayDateTime(row.next_followup_at)}</p>}
          </Link>;
        }) : <div className="lg:col-span-2"><EmptyState title="No first timers found" description={hasFilters ? "No records match these filters." : "Register the first visitor to begin the newcomer-care journey."} /></div>}
      </div>
    </div>
  );
}
