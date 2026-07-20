"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitAttendance } from "@/app/app/attendance/actions";

type Worker = { id: string; full_name: string; phone_number: string | null };

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={disabled || pending} className="min-h-12 w-full rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(79,125,243,0.2)] hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{pending ? "Submitting worker attendance…" : "Submit worker attendance"}</button>;
}

export function AttendanceForm({ workers }: { workers: Worker[] }) {
  const [presentIds, setPresentIds] = useState(() => new Set<string>());
  const allPresent = workers.length > 0 && presentIds.size === workers.length;

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

  return (
    <form action={submitAttendance} className="mt-8 space-y-6">
      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Service type<select name="service_type" required defaultValue="" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)] sm:max-w-md"><option value="" disabled>Select the service</option><option>Sunday Service</option><option>Tuesday Service</option><option>Special Service</option><option>Headquarters Service</option><option>Tarry Night</option></select></label>
      </section>
      <section className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div><h2 className="font-semibold text-[var(--color-text)]">Active roster</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Tick every worker who is present. Unticked workers are recorded absent.</p></div>
          <button type="button" onClick={toggleAll} disabled={!workers.length} className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-primary)] disabled:opacity-50 sm:w-auto">{allPresent ? "Clear all" : "Mark all present"}</button>
        </div>
        {workers.length ? (
          <div className="divide-y divide-[var(--color-border)]">
            {workers.map((worker) => {
              const present = presentIds.has(worker.id);
              return (
                <label key={worker.id} className="flex min-h-16 cursor-pointer items-center gap-4 px-5 py-4 transition hover:bg-[var(--color-surface-subtle)] sm:px-7">
                  <input type="checkbox" name="present_worker_ids" value={worker.id} checked={present} onChange={() => toggleWorker(worker.id)} className="h-5 w-5 rounded accent-[var(--color-primary)]" />
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[var(--color-text)]">{worker.full_name}</span><span className="mt-1 block text-xs text-[var(--color-text-muted)]">{worker.phone_number ?? "No phone number"}</span></span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${present ? "bg-[#edf7f1] text-[#347457]" : "bg-[#fff1f0] text-[#b5524b]"}`}>{present ? "Present" : "Absent"}</span>
                </label>
              );
            })}
          </div>
        ) : <p className="px-6 py-12 text-center text-sm text-[var(--color-text-muted)]">There are no active workers in this department.</p>}
      </section>
      <div className="sticky bottom-3 z-10 flex flex-col gap-4 rounded-2xl border border-[#dbe5ff] bg-[#edf2ff]/95 px-5 py-4 shadow-[0_16px_35px_rgba(31,48,88,0.14)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="flex gap-6 text-sm"><p><span className="font-semibold text-[var(--color-text)]">{presentIds.size}</span> <span className="text-[var(--color-text-secondary)]">present</span></p><p><span className="font-semibold text-[var(--color-text)]">{workers.length - presentIds.size}</span> <span className="text-[var(--color-text-secondary)]">absent</span></p></div>
        <SubmitButton disabled={!workers.length} />
      </div>
    </form>
  );
}
