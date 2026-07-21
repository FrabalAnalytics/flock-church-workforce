"use client";

import type { ReactNode } from "react";
import { correctChurchAttendance } from "@/app/app/church-attendance/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

function count(data: FormData, field: string) {
  const value = Number(data.get(field));
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function ChurchAttendanceCorrectionForm({
  attendanceId,
  serviceLabel,
  returnTo,
  children,
}: {
  attendanceId: string;
  serviceLabel: string;
  returnTo: string;
  children: ReactNode;
}) {
  function confirmCorrection(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const total = count(data, "adult_male_count") + count(data, "adult_female_count") + count(data, "children_count");
    const responses = count(data, "new_members_male_count") + count(data, "new_members_female_count") + count(data, "new_converts_male_count") + count(data, "new_converts_female_count");
    if (!window.confirm(`Save this correction for ${serviceLabel}?\n\n${total} total attendance · ${responses} first-time responses\n\nThis will replace the current congregation record.`)) {
      event.preventDefault();
    }
  }

  return (
    <form action={correctChurchAttendance} onSubmit={confirmCorrection} className="mt-3">
      <input type="hidden" name="attendance_id" value={attendanceId} />
      <input type="hidden" name="return_to" value={returnTo} />
      {children}
      <div className="mt-4 flex justify-end"><FormSubmitButton pendingLabel="Saving correction..." className="min-h-11 w-full rounded-xl bg-[var(--color-primary)] px-5 text-xs font-semibold text-white hover:bg-[var(--color-primary-strong)] disabled:cursor-wait disabled:opacity-60 sm:w-auto">Save correction</FormSubmitButton></div>
    </form>
  );
}
