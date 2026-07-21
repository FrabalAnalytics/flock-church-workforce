import Link from "next/link";
import { resolveFollowup } from "@/app/app/follow-ups/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { EmptyState, MetricPill, PageHeader } from "@/components/workspace-ui";

export const metadata = { title: "Care alerts", description: "Review workforce absence patterns and pastoral-care follow-ups." };
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Event = {
  id: string;
  miss_count: number;
  event_type: "soft_message" | "department_alert" | "urgent_message" | "pastoral_alert";
  message_body: string | null;
  delivery_status: "not_applicable" | "queued" | "processing" | "sent" | "delivered" | "failed" | "cancelled";
  created_at: string;
};

type FollowupWorker = {
  id: string;
  full_name: string;
  phone_number: string | null;
  whatsapp_opt_in: boolean;
  departments: { name: string } | null;
};

type CarePriority = "all" | "urgent" | "watch" | "early";

const eventLabels: Record<Event["event_type"], string> = {
  soft_message: "Gentle check-in",
  department_alert: "Department alert",
  urgent_message: "Urgent check-in",
  pastoral_alert: "Pastoral alert",
};

const deliveryStyles: Record<Event["delivery_status"], string> = {
  not_applicable: "bg-[#f2f5fb] text-[#68738a]",
  queued: "bg-[#fff3dc] text-[#a76813]",
  processing: "bg-[#fff3dc] text-[#a76813]",
  sent: "bg-[#edf2ff] text-[#4168cd]",
  delivered: "bg-[#edf7f1] text-[#347457]",
  failed: "bg-[#fff1f0] text-[#b5524b]",
  cancelled: "bg-[#f3f4f7] text-[#7b8495]",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function FollowupsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string; view?: string; q?: string; priority?: string }>;
}) {
  const { profile } = await requireProfile();
  const params = await searchParams;
  const showResolved = params.view === "resolved";
  const priority: CarePriority = ["urgent", "watch", "early"].includes(params.priority ?? "")
    ? params.priority as Exclude<CarePriority, "all">
    : "all";
  const normalizedQuery = params.q?.trim().toLocaleLowerCase() ?? "";
  const canResolve = profile.role === "super_admin" || profile.role === "department_head";
  const supabase = await createClient();
  const [followupsResult, openCountResult, resolvedCountResult] = await Promise.all([
    supabase
      .from("absence_followups")
      .select(`
        id,
        consecutive_misses,
        notes,
        resolved,
        resolved_at,
        created_at,
        workers(id, full_name, phone_number, whatsapp_opt_in, departments(name)),
        services(service_date, service_type),
        followup_events(id, miss_count, event_type, message_body, delivery_status, created_at)
      `)
      .eq("resolved", showResolved)
      .order(showResolved ? "resolved_at" : "created_at", { ascending: false })
      .limit(500),
    supabase.from("absence_followups").select("*", { count: "exact", head: true }).eq("resolved", false),
    supabase.from("absence_followups").select("*", { count: "exact", head: true }).eq("resolved", true),
  ]);
  const { data: followups, error } = followupsResult;
  const urgentCount = showResolved ? 0 : (followups ?? []).filter((followup) => followup.consecutive_misses >= 4).length;
  const visibleFollowups = (followups ?? []).filter((followup) => {
    const worker = followup.workers as unknown as FollowupWorker | null;
    const searchText = `${worker?.full_name ?? ""} ${worker?.phone_number ?? ""} ${worker?.departments?.name ?? ""}`.toLocaleLowerCase();
    const matchesSearch = !normalizedQuery || searchText.includes(normalizedQuery);
    const matchesPriority = priority === "all"
      || (priority === "urgent" && followup.consecutive_misses >= 4)
      || (priority === "watch" && followup.consecutive_misses >= 2 && followup.consecutive_misses < 4)
      || (priority === "early" && followup.consecutive_misses === 1);
    return matchesSearch && matchesPriority;
  });
  const hasFilters = Boolean(normalizedQuery || priority !== "all");
  const openParams = new URLSearchParams();
  const resolvedParams = new URLSearchParams({ view: "resolved" });
  if (params.q) {
    openParams.set("q", params.q);
    resolvedParams.set("q", params.q);
  }
  if (priority !== "all") {
    openParams.set("priority", priority);
    resolvedParams.set("priority", priority);
  }
  const clearHref = showResolved ? "/app/follow-ups?view=resolved" : "/app/follow-ups";

  return (
    <div className="mx-auto max-w-7xl">
      <WorkspaceNotice message={params.message} error={params.error ?? error?.message} />
      <PageHeader eyebrow="Pastoral care" title="Care alerts" description="Review repeated absences, communication events and completed follow-up." actions={<div className="flex flex-wrap gap-2">{urgentCount > 0 && <MetricPill value={urgentCount} label="urgent" tone="danger" />}<MetricPill value={openCountResult.count ?? 0} label="open" tone={(openCountResult.count ?? 0) > 0 ? "warning" : "neutral"} /><MetricPill value={resolvedCountResult.count ?? 0} label="resolved" /></div>} />
      <div className="mt-7 flex w-full rounded-xl bg-[#e9eef8] p-1 text-sm font-semibold sm:w-fit" role="navigation" aria-label="Care alert status">
          <Link href={`/app/follow-ups${openParams.size ? `?${openParams}` : ""}`} aria-current={!showResolved ? "page" : undefined} className={`flex min-h-11 flex-1 items-center justify-center rounded-lg px-5 sm:flex-none ${!showResolved ? "bg-white text-[#4168cd] shadow-sm" : "text-[#758097] hover:text-[#34415f]"}`}>Open <span className="ml-2 text-xs">{openCountResult.count ?? 0}</span></Link>
          <Link href={`/app/follow-ups?${resolvedParams}`} aria-current={showResolved ? "page" : undefined} className={`flex min-h-11 flex-1 items-center justify-center rounded-lg px-5 sm:flex-none ${showResolved ? "bg-white text-[#4168cd] shadow-sm" : "text-[#758097] hover:text-[#34415f]"}`}>Resolved <span className="ml-2 text-xs">{resolvedCountResult.count ?? 0}</span></Link>
      </div>

      <section className="mt-5 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)]" aria-label="Filter care alerts">
        <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end">
          {showResolved && <input type="hidden" name="view" value="resolved" />}
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Search worker or department<span className="relative mt-2 block"><svg viewBox="0 0 24 24" aria-hidden="true" className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 fill-none stroke-[var(--color-icon-muted)]" strokeWidth="1.8"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg><input name="q" defaultValue={params.q ?? ""} placeholder="Name, phone or department" className="h-12 w-full rounded-xl border border-[var(--color-border)] pl-11 pr-4 text-sm font-normal outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]" /></span></label>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Priority<select name="priority" defaultValue={priority} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]"><option value="all">All priorities</option><option value="urgent">Urgent · 4+ misses</option><option value="watch">Watch · 2–3 misses</option><option value="early">Early · 1 miss</option></select></label>
          <button className="min-h-12 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)]">Apply filters</button>
        </form>
        <div className="mt-4 flex flex-col gap-2 border-t border-[var(--color-border)] pt-4 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-[var(--color-text-secondary)]"><strong className="font-semibold text-[var(--color-text)]">{visibleFollowups.length}</strong> {visibleFollowups.length === 1 ? "alert" : "alerts"} shown{hasFilters ? " for the selected filters" : ""}.</p>{hasFilters && <Link href={clearHref} className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-strong)]">Clear filters</Link>}</div>
      </section>

      <div className="mt-8 space-y-5">
        {visibleFollowups.length ? visibleFollowups.map((followup) => {
          const worker = followup.workers as unknown as FollowupWorker | null;
          const service = followup.services as unknown as { service_date: string; service_type: string } | null;
          const events = ((followup.followup_events ?? []) as unknown as Event[])
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          return (
            <article key={followup.id} className="overflow-hidden rounded-3xl border border-[#e0e6f2] bg-white">
              <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-[#253252]">{worker?.full_name ?? "Unknown worker"}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${followup.consecutive_misses >= 4 ? "bg-[#fff1f0] text-[#b5524b]" : followup.consecutive_misses >= 2 ? "bg-[#fff3dc] text-[#a76813]" : "bg-[#edf2ff] text-[#4168cd]"}`}>
                      {followup.consecutive_misses} consecutive {followup.consecutive_misses === 1 ? "miss" : "misses"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#758097]">
                    <span>{worker?.departments?.name ?? "Department unavailable"}</span>
                    <span aria-hidden="true" className="text-[#c3cad7]">•</span>
                    {worker?.phone_number ? <a href={`tel:${worker.phone_number}`} className="inline-flex min-h-9 items-center rounded-lg bg-[var(--color-primary-soft)] px-3 font-semibold text-[var(--color-primary-strong)] hover:bg-[#e2eaff]">Call {worker.phone_number}</a> : <span>No phone number</span>}
                  </div>
                  <p className="mt-1 text-xs text-[#929bad]">
                    Latest absence: {service?.service_type ?? "Service"}{service?.service_date ? ` on ${service.service_date}` : ""} · WhatsApp {worker?.whatsapp_opt_in ? "enabled" : "off"}
                  </p>
                  {followup.notes && (
                    <div className="mt-4 whitespace-pre-line rounded-2xl bg-[#f6f8fd] px-4 py-3 text-sm leading-6 text-[#5f6b82]">{followup.notes}</div>
                  )}
                </div>
                {showResolved ? (
                  <div className="text-left lg:text-right">
                    <span className="rounded-full bg-[#edf7f1] px-3 py-1 text-xs font-semibold text-[#347457]">Resolved</span>
                    {followup.resolved_at && <p className="mt-2 text-xs text-[#929bad]">{formatDate(followup.resolved_at)}</p>}
                  </div>
                ) : canResolve ? (
                  <form action={resolveFollowup} className="w-full space-y-3 lg:w-72">
                    <input type="hidden" name="followup_id" value={followup.id} />
                    <label className="block text-xs font-semibold text-[#68738a]">
                      Resolution note
                      <textarea name="note" rows={2} placeholder="Optional care note" className="mt-2 w-full resize-none rounded-xl border border-[#dce3f1] px-3 py-2 text-sm font-normal outline-none focus:border-[#4f7df3]" />
                    </label>
                    <FormSubmitButton pendingLabel="Resolving..." className="min-h-12 w-full rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)] disabled:cursor-wait disabled:opacity-60">Mark resolved</FormSubmitButton>
                  </form>
                ) : (
                  <span className="h-fit rounded-full bg-[#f2f5fb] px-3 py-1 text-xs font-semibold text-[#68738a]">Read only</span>
                )}
              </div>

              <details className="group border-t border-[#edf0f6]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-[#4f7df3] sm:px-7">
                  <span>{events.length} communication {events.length === 1 ? "event" : "events"}<span className="ml-2 text-[#9aa3b4] group-open:hidden">Show details</span></span>
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 fill-none stroke-current transition group-open:rotate-180" strokeWidth="1.8"><path d="m7 10 5 5 5-5" /></svg>
                </summary>
                <div className="divide-y divide-[#edf0f6] border-t border-[#edf0f6] px-5 sm:px-7">
                  {events.length ? events.map((event) => (
                    <div key={event.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-start">
                      <div>
                        <p className="text-sm font-semibold text-[#34415f]">{eventLabels[event.event_type]} · Miss {event.miss_count}</p>
                        <p className="mt-1 text-xs text-[#929bad]">{formatDate(event.created_at)}</p>
                        {event.message_body && <p className="mt-3 max-w-3xl text-sm leading-6 text-[#68738a]">{event.message_body}</p>}
                      </div>
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${deliveryStyles[event.delivery_status]}`}>{event.delivery_status.replace("_", " ")}</span>
                    </div>
                  )) : <p className="py-5 text-sm text-[#8993a7]">No escalation event has been created for this alert.</p>}
                </div>
              </details>
            </article>
          );
        }) : (
          <EmptyState title={hasFilters ? "No care alerts match these filters" : showResolved ? "No resolved care alerts" : "No open care alerts"} description={hasFilters ? "Try another worker, department or priority level." : showResolved ? "Resolved follow-ups will remain available here." : "New absence patterns will appear after attendance is submitted."} action={hasFilters ? <Link href={clearHref} className="inline-flex min-h-11 items-center rounded-xl bg-[var(--color-primary-soft)] px-5 text-sm font-semibold text-[var(--color-primary-strong)]">Clear filters</Link> : undefined} />
        )}
      </div>
    </div>
  );
}
