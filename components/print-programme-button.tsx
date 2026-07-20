"use client";

export function PrintProgrammeButton() {
  return <button type="button" onClick={() => window.print()} className="print:hidden flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-5 text-sm font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-sm)] hover:bg-[var(--color-surface-subtle)] sm:w-auto"><svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8"><path d="M7 9V4h10v5M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v6H7z" /></svg>Print / Save PDF</button>;
}
