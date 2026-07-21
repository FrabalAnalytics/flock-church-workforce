"use client";

import { useState } from "react";
import { resolveFollowup } from "@/app/app/follow-ups/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

export function ResolveFollowupForm({
  followupId,
  workerName,
  returnTo,
}: {
  followupId: string;
  workerName: string;
  returnTo: string;
}) {
  const [note, setNote] = useState("");

  function confirmResolution(event: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Mark ${workerName}'s care alert as resolved? It will move to the resolved history.`)) {
      event.preventDefault();
    }
  }

  return (
    <form action={resolveFollowup} onSubmit={confirmResolution} className="w-full space-y-3 lg:w-72">
      <input type="hidden" name="followup_id" value={followupId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <label className="block text-xs font-semibold text-[#68738a]">
        Resolution note
        <textarea name="note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={2} placeholder="Optional care note" className="mt-2 w-full resize-none rounded-xl border border-[#dce3f1] px-3 py-2 text-sm font-normal outline-none focus:border-[#4f7df3]" />
      </label>
      <div className="flex items-center justify-between gap-3 text-[11px] text-[var(--color-text-muted)]"><span>Moves this alert to history</span><span>{note.length}/2,000</span></div>
      <FormSubmitButton pendingLabel="Resolving..." className="min-h-12 w-full rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)] disabled:cursor-wait disabled:opacity-60">Mark resolved</FormSubmitButton>
    </form>
  );
}
