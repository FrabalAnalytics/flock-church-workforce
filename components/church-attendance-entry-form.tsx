"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { submitChurchAttendance } from "@/app/app/church-attendance/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

type AttendanceSummary = {
  adultMale: number;
  adultFemale: number;
  children: number;
  newMembersMale: number;
  newMembersFemale: number;
  newConvertsMale: number;
  newConvertsFemale: number;
};

const initialSummary: AttendanceSummary = {
  adultMale: 0,
  adultFemale: 0,
  children: 0,
  newMembersMale: 0,
  newMembersFemale: 0,
  newConvertsMale: 0,
  newConvertsFemale: 0,
};

function numberFrom(formData: FormData, field: string) {
  const value = Number(formData.get(field));
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function ChurchAttendanceEntryForm({
  canSubmit,
  children,
}: {
  canSubmit: boolean;
  children: ReactNode;
}) {
  const [summary, setSummary] = useState(initialSummary);

  function updateSummary(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    setSummary({
      adultMale: numberFrom(data, "adult_male_count"),
      adultFemale: numberFrom(data, "adult_female_count"),
      children: numberFrom(data, "children_count"),
      newMembersMale: numberFrom(data, "new_members_male_count"),
      newMembersFemale: numberFrom(data, "new_members_female_count"),
      newConvertsMale: numberFrom(data, "new_converts_male_count"),
      newConvertsFemale: numberFrom(data, "new_converts_female_count"),
    });
  }

  const attendanceTotal = summary.adultMale + summary.adultFemale + summary.children;
  const maleResponses = summary.newMembersMale + summary.newConvertsMale;
  const femaleResponses = summary.newMembersFemale + summary.newConvertsFemale;
  const responseTotal = maleResponses + femaleResponses;
  const maleOverCount = maleResponses > summary.adultMale;
  const femaleOverCount = femaleResponses > summary.adultFemale;
  const hasInvalidResponses = maleOverCount || femaleOverCount;

  return (
    <form action={submitChurchAttendance} onInput={updateSummary} className="mt-5">
      {children}
      <div className={`sticky bottom-3 z-10 mt-5 rounded-2xl border px-5 py-4 shadow-[0_16px_35px_rgba(31,48,88,0.14)] backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-6 ${hasInvalidResponses ? "border-[#efc7c3] bg-[#fff5f4]/95" : "border-[#dbe5ff] bg-[#edf2ff]/95"}`}>
        <div aria-live="polite">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <p><span className="text-2xl font-semibold text-[var(--color-text)]">{attendanceTotal}</span> <span className="text-[var(--color-text-secondary)]">total attendance</span></p>
            <p><span className="font-semibold text-[var(--color-text)]">{responseTotal}</span> <span className="text-[var(--color-text-secondary)]">first-time responses</span></p>
          </div>
          <p className={`mt-2 text-xs font-medium ${hasInvalidResponses ? "text-[#b5524b]" : "text-[var(--color-text-muted)]"}`}>
            {hasInvalidResponses
              ? `${maleOverCount ? "Male" : "Female"} responses exceed the matching adult attendance total.`
              : `${maleResponses} of ${summary.adultMale} adult male and ${femaleResponses} of ${summary.adultFemale} adult female attendees are recorded as first-time responses.`}
          </p>
        </div>
        <FormSubmitButton disabled={!canSubmit || hasInvalidResponses} pendingLabel="Saving attendance..." className="mt-4 min-h-12 w-full shrink-0 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:bg-[#aebbdc] sm:mt-0 sm:w-auto">Save church attendance</FormSubmitButton>
      </div>
    </form>
  );
}
