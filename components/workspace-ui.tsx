import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-primary)]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "info" | "success" | "warning" | "danger" }) {
  const styles = {
    neutral: "bg-[#f1f3f6] text-[#68738a]",
    info: "bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]",
    success: "bg-[#edf7f1] text-[#347457]",
    warning: "bg-[#fff3dc] text-[#966315]",
    danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  };
  return <span className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.7"><path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-9ZM9 12h6" /></svg>
      </div>
      <h2 className="mt-4 text-base font-semibold text-[#526078]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function MetricPill({ label, value, tone = "neutral" }: { label: string; value: number | string; tone?: "neutral" | "warning" | "danger" }) {
  const styles = tone === "danger" ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]" : tone === "warning" ? "bg-[#fff3dc] text-[#966315]" : "bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]";
  return <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold ${styles}`}><strong className="text-sm">{value}</strong>{label}</span>;
}
