"use client";

import { useEffect } from "react";

export function AttendanceDraftCleanup({ draftKey }: { draftKey: string }) {
  useEffect(() => {
    try {
      window.localStorage.removeItem(draftKey);
      const url = new URL(window.location.href);
      url.searchParams.delete("clear_attendance_draft");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // Submission already succeeded; unavailable device storage is harmless.
    }
  }, [draftKey]);

  return null;
}
