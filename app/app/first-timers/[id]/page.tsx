import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  recordFirstTimerInteraction,
  recordFirstTimerReturnVisit,
  updateFirstTimerContact,
  updateFirstTimerJourney,
} from "@/app/app/first-timers/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { PageHeader, StatusBadge } from "@/components/workspace-ui";
import { requireProfile } from "@/lib/auth";
import { firstTimerStageLabels, firstTimerStages, serviceTypes, type FirstTimerStage } from "@/lib/first-timers";
import { createClient } from "@/lib/supabase/server";

type FirstTimerRecord = {
  id: string;
  full_name: string;
  phone_number: string;
  phone_number_normalized: string;
  email: string | null;
  preferred_contact: string;
  consent_to_contact: boolean;
  consent_recorded_at: string | null;
  first_visit_date: string;
  first_service_type: string;
  location: string | null;
  how_heard: string | null;
  interests: string | null;
  journey_stage: FirstTimerStage;
  assigned_to: string | null;
  registered_by: string | null;
  next_followup_at: string | null;
  last_contacted_at: string | null;
  closed_reason: string | null;
  created_at: string;
};

type Interaction = {
  id: string;
  interaction_type: string;
  outcome: string;
  notes: string | null;
  next_followup_at: string | null;
  created_by: string | null;
  created_at: string;
};

type Visit = {
  id: string;
  visit_date: string;
  service_type: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
};

const managerRoles = new Set(["super_admin", "church_leader", "first_timer_coordinator"]);

function dateOnly(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(value));
}

function lagosDate() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function stageTone(stage: FirstTimerStage): "neutral" | "info" | "success" | "warning" | "danger" {
  if (stage === "integrated") return "success";
  if (stage === "closed") return "neutral";
  if (stage === "new") return "warning";
  if (["returned", "connected"].includes(stage)) return "info";
  return "neutral";
}

export default async function FirstTimerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { profile } = await requireProfile();
  if (!managerRoles.has(profile.role)) redirect("/app");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [{ data: personData, error }, { data: interactionData }, { data: visitData }, { data: coordinators }] = await Promise.all([
    supabase.from("first_timers").select("id, full_name, phone_number, phone_number_normalized, email, preferred_contact, consent_to_contact, consent_recorded_at, first_visit_date, first_service_type, location, how_heard, interests, journey_stage, assigned_to, registered_by, next_followup_at, last_contacted_at, closed_reason, created_at").eq("id", id).maybeSingle(),
    supabase.from("first_timer_interactions").select("id, interaction_type, outcome, notes, next_followup_at, created_by, created_at").eq("first_timer_id", id).order("created_at", { ascending: false }),
    supabase.from("first_timer_visits").select("id, visit_date, service_type, notes, recorded_by, created_at").eq("first_timer_id", id).order("visit_date", { ascending: false }),
    supabase.from("profiles").select("id, full_name").eq("role", "first_timer_coordinator").order("full_name"),
  ]);
  if (error || !personData) notFound();
  const person = personData as FirstTimerRecord;
  const interactions = (interactionData ?? []) as Interaction[];
  const visits = (visitData ?? []) as Visit[];
  const teamIds = [...new Set([person.assigned_to, person.registered_by, ...interactions.map((item) => item.created_by), ...visits.map((visit) => visit.recorded_by)].filter(Boolean))] as string[];
  const { data: teamProfiles } = teamIds.length ? await supabase.from("profiles").select("id, full_name").in("id", teamIds) : { data: [] };
  const names = new Map((teamProfiles ?? []).map((teamMember) => [teamMember.id, teamMember.full_name]));
  for (const coordinator of coordinators ?? []) names.set(coordinator.id, coordinator.full_name);
  const active = !["integrated", "closed"].includes(person.journey_stage);
  const overdue = active && person.next_followup_at && new Date(person.next_followup_at) <= new Date();
  const whatsappNumber = person.phone_number_normalized.startsWith("0") ? `234${person.phone_number_normalized.slice(1)}` : person.phone_number_normalized;
  const timeline = [
    ...interactions.map((item) => ({ key: `interaction-${item.id}`, timestamp: item.created_at, type: item.interaction_type, title: item.outcome, detail: item.notes, actor: item.created_by ? names.get(item.created_by) : null, next: item.next_followup_at })),
    ...visits.map((visit) => ({ key: `visit-${visit.id}`, timestamp: `${visit.visit_date}T12:00:00Z`, type: "service visit", title: `${visit.service_type} · ${dateOnly(visit.visit_date)}`, detail: visit.notes, actor: visit.recorded_by ? names.get(visit.recorded_by) : null, next: null })),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="mx-auto max-w-7xl">
      <WorkspaceNotice message={query.message} error={query.error} />
      <Link href="/app/first-timers" className="mb-5 inline-flex min-h-10 items-center text-sm font-semibold text-[var(--color-primary)]">← Back to first timers</Link>
      <PageHeader
        eyebrow="First-timer journey"
        title={person.full_name}
        description={`${person.first_service_type} · First visited ${dateOnly(person.first_visit_date)}`}
        actions={<div className="flex w-full flex-wrap gap-2 sm:w-auto">{person.consent_to_contact && <><a href={`tel:${person.phone_number}`} className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-text-secondary)] sm:flex-none">Call</a><a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[#e7f7ed] px-4 text-sm font-semibold text-[#28764b] sm:flex-none">WhatsApp</a></>}<StatusBadge tone={overdue ? "danger" : stageTone(person.journey_stage)}>{overdue ? "Follow-up overdue" : firstTimerStageLabels[person.journey_stage]}</StatusBadge></div>}
      />

      {!person.consent_to_contact && <div className="mt-6 rounded-2xl border border-[#efd7a9] bg-[#fff9ec] px-5 py-4 text-sm leading-6 text-[#7b5b19]"><strong>No contact consent.</strong> Do not call, message or schedule follow-up. Internal notes and an in-person return visit may still be recorded.</div>}

      <div className="mt-7 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Contact and context</h2><StatusBadge tone={person.consent_to_contact ? "success" : "warning"}>{person.consent_to_contact ? `Consent · ${person.preferred_contact}` : "No consent"}</StatusBadge></div>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div><dt className="text-xs font-semibold text-[var(--color-text-muted)]">Phone</dt><dd className="mt-1 font-medium text-[var(--color-text)]">{person.phone_number}</dd></div>
              <div><dt className="text-xs font-semibold text-[var(--color-text-muted)]">Email</dt><dd className="mt-1 break-all font-medium text-[var(--color-text)]">{person.email ?? "Not provided"}</dd></div>
              <div><dt className="text-xs font-semibold text-[var(--color-text-muted)]">Location</dt><dd className="mt-1 font-medium text-[var(--color-text)]">{person.location ?? "Not recorded"}</dd></div>
              <div><dt className="text-xs font-semibold text-[var(--color-text-muted)]">How they heard</dt><dd className="mt-1 font-medium text-[var(--color-text)]">{person.how_heard ?? "Not recorded"}</dd></div>
              <div className="sm:col-span-2 xl:col-span-1 2xl:col-span-2"><dt className="text-xs font-semibold text-[var(--color-text-muted)]">Interests</dt><dd className="mt-1 font-medium text-[var(--color-text)]">{person.interests ?? "Not recorded"}</dd></div>
            </dl>
          </section>

          <details className="rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-[var(--color-text-secondary)] sm:px-6">Edit contact details and consent</summary>
            <form action={updateFirstTimerContact} className="grid gap-4 border-t border-[var(--color-border)] p-5 sm:grid-cols-2 sm:p-6">
              <input type="hidden" name="first_timer_id" value={person.id} />
              <label className="text-sm font-semibold text-[var(--color-text-secondary)] sm:col-span-2">Full name<input name="full_name" required minLength={2} maxLength={120} defaultValue={person.full_name} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal" /></label>
              <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Phone<input name="phone_number" type="tel" required minLength={7} maxLength={40} defaultValue={person.phone_number} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal" /></label>
              <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Email<input name="email" type="email" maxLength={254} defaultValue={person.email ?? ""} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal" /></label>
              <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Location<input name="location" maxLength={160} defaultValue={person.location ?? ""} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal" /></label>
              <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Preferred contact<select name="preferred_contact" defaultValue={person.preferred_contact} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal"><option value="phone">Phone call</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">Email</option><option value="none">No contact</option></select></label>
              <label className="text-sm font-semibold text-[var(--color-text-secondary)] sm:col-span-2">How they heard about us<input name="how_heard" maxLength={240} defaultValue={person.how_heard ?? ""} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal" /></label>
              <label className="text-sm font-semibold text-[var(--color-text-secondary)] sm:col-span-2">Interests<input name="interests" maxLength={500} defaultValue={person.interests ?? ""} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal" /></label>
              <label className="flex items-start gap-3 rounded-2xl border border-[#dbe8df] bg-[#f4faf6] p-4 text-sm leading-6 text-[#3f654d] sm:col-span-2"><input name="consent_to_contact" type="checkbox" defaultChecked={person.consent_to_contact} className="mt-1 h-4 w-4 accent-[var(--color-primary)]" /><span>The visitor currently consents to welcome and follow-up contact. Unchecking this immediately clears scheduled follow-up.</span></label>
              <div className="sm:col-span-2"><FormSubmitButton pendingLabel="Saving details..." className="min-h-12 w-full rounded-xl bg-[var(--color-primary-soft)] px-5 text-sm font-semibold text-[var(--color-primary-strong)] disabled:opacity-60">Save details</FormSubmitButton></div>
            </form>
          </details>

          <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <h2 className="text-lg font-semibold">Journey management</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">Assign an accountable coordinator, set the current stage and schedule the next action.</p>
            <form action={updateFirstTimerJourney} className="mt-5 space-y-4">
              <input type="hidden" name="first_timer_id" value={person.id} />
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Coordinator<select name="assigned_to" defaultValue={person.assigned_to ?? ""} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal"><option value="">Unassigned</option>{coordinators?.map((coordinator) => <option key={coordinator.id} value={coordinator.id}>{coordinator.full_name}</option>)}</select></label>
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Journey stage<select name="journey_stage" defaultValue={person.journey_stage} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal">{firstTimerStages.map((stage) => <option key={stage} value={stage}>{firstTimerStageLabels[stage]}</option>)}</select></label>
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Next follow-up <span className="font-normal text-[var(--color-text-muted)]">Optional</span><input name="next_followup_at" type="datetime-local" disabled={!person.consent_to_contact} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm font-normal disabled:bg-[var(--color-surface-subtle)]" /></label>
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Closure reason <span className="font-normal text-[var(--color-text-muted)]">Required only when closing</span><textarea name="closed_reason" maxLength={500} rows={3} defaultValue={person.closed_reason ?? ""} placeholder="For example: requested no further contact, relocated, or unable to reach" className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-3 py-3 text-sm font-normal" /></label>
              <FormSubmitButton pendingLabel="Saving journey..." className="min-h-12 w-full rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">Save journey</FormSubmitButton>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-[#d9e3fb] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Record coordinator follow-up</h2><p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">Add the outcome, not a transcript of a private conversation.</p></div>{person.last_contacted_at && <StatusBadge>Last contact {dateTime(person.last_contacted_at)}</StatusBadge>}</div>
            <form action={recordFirstTimerInteraction} className="mt-5 grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="first_timer_id" value={person.id} />
              <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Contact method<select name="interaction_type" defaultValue={person.consent_to_contact ? person.preferred_contact === "phone" ? "call" : person.preferred_contact : "note"} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal"><option value="call">Phone call</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">Email</option><option value="visit">Personal visit</option><option value="note">Internal note</option></select></label>
              <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Next follow-up <span className="font-normal text-[var(--color-text-muted)]">Optional</span><input name="next_followup_at" type="datetime-local" disabled={!person.consent_to_contact} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm font-normal disabled:bg-[var(--color-surface-subtle)]" /></label>
              <label className="text-sm font-semibold text-[var(--color-text-secondary)] sm:col-span-2">Outcome<input name="outcome" required minLength={2} maxLength={240} placeholder="For example: Welcome call completed; plans to return Sunday" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal" /></label>
              <label className="text-sm font-semibold text-[var(--color-text-secondary)] sm:col-span-2">Brief notes <span className="font-normal text-[var(--color-text-muted)]">Optional</span><textarea name="notes" maxLength={2000} rows={4} className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-normal" /></label>
              <div className="sm:col-span-2 sm:flex sm:justify-end"><FormSubmitButton pendingLabel="Recording..." className="min-h-12 w-full rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60 sm:w-auto">Record follow-up</FormSubmitButton></div>
            </form>
          </section>

          <details className="rounded-3xl border border-[#dbe8df] bg-white shadow-[var(--shadow-sm)]">
            <summary className="cursor-pointer list-none rounded-3xl bg-[#f4faf6] px-5 py-4 font-semibold text-[#315e41] sm:px-6">Record a return visit</summary>
            <form action={recordFirstTimerReturnVisit} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <input type="hidden" name="first_timer_id" value={person.id} />
              <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Visit date<input name="visit_date" type="date" required max={lagosDate()} defaultValue={lagosDate()} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm font-normal" /></label>
              <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Service<select name="service_type" defaultValue="Sunday Service" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal">{serviceTypes.map((service) => <option key={service}>{service}</option>)}</select></label>
              <label className="text-sm font-semibold text-[var(--color-text-secondary)] sm:col-span-2">Notes <span className="font-normal text-[var(--color-text-muted)]">Optional</span><input name="notes" maxLength={500} placeholder="Recognised by coordinator or checked in at welcome desk" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal" /></label>
              <div className="sm:col-span-2 sm:flex sm:justify-end"><FormSubmitButton pendingLabel="Recording visit..." className="min-h-12 w-full rounded-xl bg-[#347457] px-6 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60 sm:w-auto">Record return visit</FormSubmitButton></div>
            </form>
          </details>

          <section className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
            <div className="border-b border-[var(--color-border)] px-5 py-4 sm:px-6"><h2 className="text-lg font-semibold">Journey timeline</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">{visits.length} recorded visit{visits.length === 1 ? "" : "s"} · {interactions.length} follow-up entr{interactions.length === 1 ? "y" : "ies"}</p></div>
            <div className="divide-y divide-[var(--color-border)]">
              {timeline.length ? timeline.map((item) => <article key={item.key} className="p-5 sm:px-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold capitalize text-[var(--color-text)]">{item.type}</p><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{item.title}</p></div><time className="text-xs font-medium text-[var(--color-text-muted)]">{dateTime(item.timestamp)}</time></div>{item.detail && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[var(--color-surface-subtle)] px-3 py-2 text-xs leading-5 text-[var(--color-text-secondary)]">{item.detail}</p>}<p className="mt-3 text-[11px] text-[var(--color-text-muted)]">Recorded by {item.actor ?? "authorised team member"}{item.next ? ` · next follow-up ${dateTime(item.next)}` : ""}</p></article>) : <p className="p-6 text-sm text-[var(--color-text-muted)]">No journey activity has been recorded.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
