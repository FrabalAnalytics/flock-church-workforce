import Link from "next/link";
import { resolveFollowup } from "@/app/app/follow-ups/actions";
import { WorkspaceNotice } from "@/components/workspace-notice";
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
  searchParams: Promise<{ message?: string; error?: string; view?: string }>;
}) {
  const { profile } = await requireProfile();
  const params = await searchParams;
  const showResolved = params.view === "resolved";
  const canResolve = profile.role === "super_admin" || profile.role === "department_head";
  const supabase = await createClient();
  const { data: followups, error } = await supabase
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
    .order(showResolved ? "resolved_at" : "created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl">
      <WorkspaceNotice message={params.message} error={params.error ?? error?.message} />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#4f7df3]">Pastoral care</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Care alerts</h1>
          <p className="mt-2 text-sm text-[#758097]">Review repeated absences, communication events and completed follow-up.</p>
        </div>
        <div className="flex rounded-xl bg-[#e9eef8] p-1 text-sm font-semibold">
          <Link href="/app/follow-ups" className={`rounded-lg px-4 py-2 ${!showResolved ? "bg-white text-[#4168cd] shadow-sm" : "text-[#758097]"}`}>Open</Link>
          <Link href="/app/follow-ups?view=resolved" className={`rounded-lg px-4 py-2 ${showResolved ? "bg-white text-[#4168cd] shadow-sm" : "text-[#758097]"}`}>Resolved</Link>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {followups?.length ? followups.map((followup) => {
          const worker = followup.workers as unknown as {
            id: string;
            full_name: string;
            phone_number: string | null;
            whatsapp_opt_in: boolean;
            departments: { name: string } | null;
          } | null;
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
                  <p className="mt-2 text-sm text-[#758097]">
                    {worker?.departments?.name ?? "Department unavailable"} · {worker?.phone_number ?? "No phone number"}
                  </p>
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
                    <button className="w-full rounded-xl bg-[#4f7df3] px-4 py-2.5 text-sm font-semibold text-white">Mark resolved</button>
                  </form>
                ) : (
                  <span className="h-fit rounded-full bg-[#f2f5fb] px-3 py-1 text-xs font-semibold text-[#68738a]">Read only</span>
                )}
              </div>

              <details className="group border-t border-[#edf0f6]">
                <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-[#4f7df3] sm:px-7">
                  {events.length} communication {events.length === 1 ? "event" : "events"}
                  <span className="ml-2 text-[#9aa3b4] group-open:hidden">Show details</span>
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
          <div className="rounded-3xl border border-dashed border-[#d8dfed] bg-white px-6 py-16 text-center">
            <p className="font-semibold text-[#526078]">{showResolved ? "No resolved care alerts" : "No open care alerts"}</p>
            <p className="mt-2 text-sm text-[#929bad]">{showResolved ? "Resolved follow-ups will remain available here." : "New absence patterns will appear after attendance is submitted."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
