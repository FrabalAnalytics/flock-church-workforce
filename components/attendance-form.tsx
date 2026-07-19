"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitAttendance } from "@/app/app/attendance/actions";

type Worker = {
  id: string;
  full_name: string;
  phone_number: string | null;
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-xl bg-[#4f7df3] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(79,125,243,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Submitting worker attendance…" : "Submit worker attendance"}
    </button>
  );
}

export function AttendanceForm({ workers }: { workers: Worker[] }) {
  const [presentIds, setPresentIds] = useState(() => new Set<string>());
  const allPresent = workers.length > 0 && presentIds.size === workers.length;

  function toggleWorker(id: string) {
    setPresentIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setPresentIds(allPresent ? new Set() : new Set(workers.map((worker) => worker.id)));
  }

  return (
    <form action={submitAttendance} className="mt-8 space-y-6">
      <section className="rounded-3xl border border-[#e0e6f2] bg-white p-5 sm:p-7">
        <label className="block text-sm font-semibold text-[#34415f]">
          Service type
          <select
            name="service_type"
            required
            defaultValue=""
            className="mt-2 h-12 w-full rounded-xl border border-[#dce3f1] bg-white px-4 text-sm outline-none focus:border-[#4f7df3] sm:max-w-md"
          >
            <option value="" disabled>Select the service</option>
            <option>Sunday Service</option>
            <option>Tuesday Service</option>
            <option>Special Service</option>
            <option>Headquarters Service</option>
            <option>Tarry Night</option>
          </select>
        </label>
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#e0e6f2] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#e8ecf4] bg-[#f8f9fc] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <h2 className="font-semibold text-[#253252]">Active roster</h2>
            <p className="mt-1 text-xs text-[#8993a7]">Tick every worker who is present. Unticked workers are recorded absent.</p>
          </div>
          <button type="button" onClick={toggleAll} disabled={!workers.length} className="w-fit text-sm font-semibold text-[#4f7df3] disabled:opacity-50">
            {allPresent ? "Clear all" : "Mark all present"}
          </button>
        </div>

        {workers.length ? (
          <div className="divide-y divide-[#edf0f6]">
            {workers.map((worker) => {
              const present = presentIds.has(worker.id);
              return (
                <label key={worker.id} className="flex cursor-pointer items-center gap-4 px-5 py-4 transition hover:bg-[#fafbfe] sm:px-7">
                  <input
                    type="checkbox"
                    name="present_worker_ids"
                    value={worker.id}
                    checked={present}
                    onChange={() => toggleWorker(worker.id)}
                    className="h-5 w-5 rounded accent-[#4f7df3]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#253252]">{worker.full_name}</span>
                    <span className="mt-1 block text-xs text-[#8993a7]">{worker.phone_number ?? "No phone number"}</span>
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${present ? "bg-[#edf7f1] text-[#347457]" : "bg-[#fff1f0] text-[#b5524b]"}`}>
                    {present ? "Present" : "Absent"}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="px-6 py-12 text-center text-sm text-[#8993a7]">There are no active workers in this department.</p>
        )}
      </section>

      <div className="flex flex-col gap-4 rounded-2xl bg-[#edf2ff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-6 text-sm">
          <p><span className="font-semibold text-[#253252]">{presentIds.size}</span> <span className="text-[#68738a]">present</span></p>
          <p><span className="font-semibold text-[#253252]">{workers.length - presentIds.size}</span> <span className="text-[#68738a]">absent</span></p>
        </div>
        <SubmitButton disabled={!workers.length} />
      </div>
    </form>
  );
}
