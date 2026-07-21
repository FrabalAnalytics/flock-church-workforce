"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitAttendance } from "@/app/app/attendance/actions";

type Worker = { id: string; full_name: string; phone_number: string | null };

const defaultServiceTypes = ["Sunday Service", "Tuesday Service", "Special Service", "Headquarters Service", "Tarry Night"];

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={disabled || pending} className="min-h-12 w-full rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(79,125,243,0.2)] hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{pending ? "Submitting worker attendance…" : "Submit worker attendance"}</button>;
}

export function AttendanceForm({
  workers,
  submittedServiceTypes = [],
  availableServiceTypes = defaultServiceTypes,
  scheduleMessage,
}: {
  workers: Worker[];
  submittedServiceTypes?: string[];
  availableServiceTypes?: string[];
  scheduleMessage?: string;
}) {
  const [presentIds, setPresentIds] = useState(() => new Set<string>());
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "present" | "absent">("all");
  const [selectedService, setSelectedService] = useState("");
  const submittedServices = new Set(submittedServiceTypes);
  const replacesSubmission = submittedServices.has(selectedService);
  const allPresent = workers.length > 0 && presentIds.size === workers.length;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleWorkers = workers.filter((worker) => {
    const matchesQuery = !normalizedQuery || `${worker.full_name} ${worker.phone_number ?? ""}`.toLocaleLowerCase().includes(normalizedQuery);
    const matchesView = view === "all" || (view === "present" ? presentIds.has(worker.id) : !presentIds.has(worker.id));
    return matchesQuery && matchesView;
  });

  function toggleWorker(id: string) {
    setPresentIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setPresentIds(allPresent ? new Set() : new Set(workers.map((worker) => worker.id)));
  }

  function confirmSubmission(event: React.FormEvent<HTMLFormElement>) {
    const absentCount = workers.length - presentIds.size;
    const confirmation: string[] = [];
    if (replacesSubmission) confirmation.push(`${selectedService} was already submitted today. Saving will replace its current worker attendance.`);
    if (absentCount > 0) confirmation.push(`${absentCount} ${absentCount === 1 ? "worker is" : "workers are"} marked absent.`);
    if (confirmation.length && !window.confirm(`${confirmation.join("\n\n")}\n\nContinue?`)) {
      event.preventDefault();
    }
  }

  return (
    <form action={submitAttendance} onSubmit={confirmSubmission} className="mt-8 space-y-6">
      {Array.from(presentIds).map((id) => <input key={id} type="hidden" name="present_worker_ids" value={id} />)}
      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Service type<select name="service_type" required disabled={!availableServiceTypes.length} value={selectedService} onChange={(event) => setSelectedService(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-subtle)] sm:max-w-md"><option value="" disabled>{availableServiceTypes.length ? "Select the service" : "No open service available"}</option>{availableServiceTypes.map((service) => <option key={service} value={service}>{service}{submittedServices.has(service) ? " · already submitted" : ""}</option>)}</select></label>
        {scheduleMessage && <p className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]">{scheduleMessage}</p>}
        {replacesSubmission && <div className="mt-4 rounded-2xl border border-[#f0dfbd] bg-[#fffaf0] px-4 py-3 text-sm leading-6 text-[#80662f]" role="status"><strong className="font-semibold">Correction mode.</strong> Saving this roster will replace the existing {selectedService} attendance for today.</div>}
      </section>
      <section className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div><h2 className="font-semibold text-[var(--color-text)]">Active roster</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Tick every worker who is present. Unticked workers are recorded absent.</p></div>
          <button type="button" onClick={toggleAll} disabled={!workers.length} className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-primary)] disabled:opacity-50 sm:w-auto">{allPresent ? "Clear all" : "Mark all present"}</button>
        </div>
        {workers.length > 0 && <div className="border-b border-[var(--color-border)] bg-white px-5 py-4 sm:px-7">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <label className="relative block">
              <span className="sr-only">Search active roster</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 fill-none stroke-[var(--color-icon-muted)]" strokeWidth="1.8"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
              <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search worker name or phone" className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white pl-11 pr-4 text-sm outline-none focus:border-[var(--color-primary)]" />
            </label>
            <div className="flex rounded-xl bg-[var(--color-surface-subtle)] p-1" aria-label="Filter attendance status">
              {(["all", "present", "absent"] as const).map((option) => <button key={option} type="button" onClick={() => setView(option)} aria-pressed={view === option} className={`min-h-10 flex-1 rounded-lg px-3 text-xs font-semibold capitalize transition sm:flex-none ${view === option ? "bg-white text-[var(--color-primary-strong)] shadow-[var(--shadow-sm)]" : "text-[var(--color-text-secondary)]"}`}>{option}</button>)}
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]" aria-live="polite">Showing {visibleWorkers.length} of {workers.length} active workers. Filtering does not change marked attendance.</p>
        </div>}
        {workers.length ? (
          <div className="divide-y divide-[var(--color-border)]">
            {visibleWorkers.map((worker) => {
              const present = presentIds.has(worker.id);
              return (
                <label key={worker.id} className="flex min-h-16 cursor-pointer items-center gap-4 px-5 py-4 transition hover:bg-[var(--color-surface-subtle)] sm:px-7">
                  <input type="checkbox" checked={present} onChange={() => toggleWorker(worker.id)} className="h-5 w-5 rounded accent-[var(--color-primary)]" />
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[var(--color-text)]">{worker.full_name}</span><span className="mt-1 block text-xs text-[var(--color-text-muted)]">{worker.phone_number ?? "No phone number"}</span></span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${present ? "bg-[#edf7f1] text-[#347457]" : "bg-[#fff1f0] text-[#b5524b]"}`}>{present ? "Present" : "Absent"}</span>
                </label>
              );
            })}
            {!visibleWorkers.length && <div className="px-6 py-12 text-center"><p className="text-sm font-semibold text-[var(--color-text-secondary)]">No workers match this view</p><button type="button" onClick={() => { setQuery(""); setView("all"); }} className="mt-3 min-h-11 rounded-xl px-4 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]">Clear roster filters</button></div>}
          </div>
        ) : <p className="px-6 py-12 text-center text-sm text-[var(--color-text-muted)]">There are no active workers in this department.</p>}
      </section>
      <div className="sticky bottom-3 z-10 flex flex-col gap-4 rounded-2xl border border-[#dbe5ff] bg-[#edf2ff]/95 px-5 py-4 shadow-[0_16px_35px_rgba(31,48,88,0.14)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="flex gap-6 text-sm"><p><span className="font-semibold text-[var(--color-text)]">{presentIds.size}</span> <span className="text-[var(--color-text-secondary)]">present</span></p><p><span className="font-semibold text-[var(--color-text)]">{workers.length - presentIds.size}</span> <span className="text-[var(--color-text-secondary)]">absent</span></p></div>
        <SubmitButton disabled={!workers.length || !availableServiceTypes.length} />
      </div>
    </form>
  );
}
