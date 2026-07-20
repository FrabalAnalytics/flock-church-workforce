"use client";

import { useEffect } from "react";

export default function WorkspaceError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
      <div className="w-full rounded-3xl border border-[var(--color-border)] bg-white p-7 text-center shadow-[var(--shadow-sm)] sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-danger-soft)] text-[var(--color-danger)]"><svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-none stroke-current" strokeWidth="1.7"><path d="M12 8v5m0 3.5v.01M10 3.8 2.6 17a2 2 0 0 0 1.75 3h15.3a2 2 0 0 0 1.75-3L14 3.8a2.3 2.3 0 0 0-4 0Z" /></svg></div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-danger)]">Temporary problem</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">This page could not load</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">Your data has not been changed. The connection may have been interrupted, so please try loading this page again.</p>
        {error.digest && <p className="mt-3 text-xs text-[var(--color-text-muted)]">Reference: {error.digest}</p>}
        <button type="button" onClick={() => unstable_retry()} className="mt-7 min-h-12 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)]">Try again</button>
      </div>
    </section>
  );
}
