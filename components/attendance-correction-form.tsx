"use client";

import type { ReactNode } from "react";
import { correctSubmittedAttendance } from "@/app/app/attendance/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

export function AttendanceCorrectionForm({
  submissionId,
  serviceLabel,
  rosterCount,
  returnTo,
  children,
}: {
  submissionId: string;
  serviceLabel: string;
  rosterCount: number;
  returnTo: string;
  children: ReactNode;
}) {
  function confirmCorrection(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const presentCount = new Set(data.getAll("present_worker_ids").map(String)).size;
    const absentCount = Math.max(0, rosterCount - presentCount);
    if (!window.confirm(`Save this correction for ${serviceLabel}?\n\n${presentCount} present · ${absentCount} absent\n\nThis will replace the submitted worker statuses and recalculate care alerts.`)) {
      event.preventDefault();
    }
  }

  return (
    <form action={correctSubmittedAttendance} onSubmit={confirmCorrection} className="mt-4">
      <input type="hidden" name="submission_id" value={submissionId} />
      <input type="hidden" name="return_to" value={returnTo} />
      {children}
      <div className="mt-4 flex justify-end"><FormSubmitButton pendingLabel="Saving correction..." className="min-h-12 w-full rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)] disabled:cursor-wait disabled:opacity-60 sm:w-auto">Save correction</FormSubmitButton></div>
    </form>
  );
}
