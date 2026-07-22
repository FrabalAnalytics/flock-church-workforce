"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type WorkspaceIcon =
  | "overview"
  | "actions"
  | "people"
  | "departments"
  | "ministers"
  | "users"
  | "attendance"
  | "control"
  | "congregation"
  | "programme"
  | "care"
  | "audit"
  | "settings"
  | "setup";

export type WorkspaceLink = {
  label: string;
  href: string;
  icon: WorkspaceIcon;
};

export type WorkspaceGroup = {
  label: string;
  links: WorkspaceLink[];
};

function NavIcon({ name }: { name: WorkspaceIcon }) {
  const paths: Record<WorkspaceIcon, React.ReactNode> = {
    overview: <><path d="M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z" /></>,
    actions: <><path d="M12 3a7 7 0 0 0-7 7v3l-2 3h18l-2-3v-3a7 7 0 0 0-7-7Z" /><path d="M9.5 20h5M12 7v4m0 2.5v.5" /></>,
    people: <><path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-4A4.5 4.5 0 0 0 3 18.5V20" /><circle cx="9.5" cy="7" r="4" /><path d="M17 11a3.5 3.5 0 0 0 0-7M18.5 14.5a4 4 0 0 1 2.5 3.7V20" /></>,
    departments: <><path d="M4 20V8l8-4 8 4v12M8 20v-8h8v8M2 20h20" /></>,
    ministers: <><circle cx="12" cy="8" r="4" /><path d="M5 20a7 7 0 0 1 14 0M12 12v8" /></>,
    users: <><path d="M15 19a6 6 0 0 0-12 0" /><circle cx="9" cy="8" r="4" /><path d="M17 11v6m3-3h-6" /></>,
    attendance: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4m8-4v4M4 10h16m-12 4 2 2 4-4" /></>,
    control: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h10M7 14h4m4 0h2M8 2v4m8-4v4" /></>,
    congregation: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5.5a3 3 0 0 1 0 5.8M18 14a5.5 5.5 0 0 1 3.5 5" /></>,
    programme: <><path d="M6 3h12a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    care: <><path d="M12 21S4 16.5 4 9.5A4.5 4.5 0 0 1 12 6.7a4.5 4.5 0 0 1 8 2.8C20 16.5 12 21 12 21Z" /></>,
    audit: <><path d="M9 4H6a2 2 0 0 0-2 2v14h16V6a2 2 0 0 0-2-2h-3M9 3h6v4H9V3Z" /><path d="m8 13 2 2 5-5M8 18h8" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.56V21h-4v-.08A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15a1.7 1.7 0 0 0-1.56-1H3v-4h.08A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63a1.7 1.7 0 0 0 1-1.56V3h4v.08A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9a1.7 1.7 0 0 0 1.56 1H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z" /></>,
    setup: <><path d="M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z" /><path d="M7 9h10M7 14l2 2 4-4" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function matchesPath(pathname: string, href: string) {
  if (href === "/app") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationGroups({ groups, currentHref, onNavigate }: { groups: WorkspaceGroup[]; currentHref?: string; onNavigate?: () => void }) {
  return (
    <div className="space-y-7">
      {groups.map((group) => (
        <section key={group.label} aria-labelledby={`nav-${group.label.toLowerCase().replaceAll(" ", "-")}`}>
          <h2 id={`nav-${group.label.toLowerCase().replaceAll(" ", "-")}`} className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            {group.label}
          </h2>
          <div className="space-y-1">
            {group.links.map((link) => {
              const active = currentHref === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)] shadow-[inset_3px_0_0_var(--color-primary)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)]"}`}
                >
                  <span className={active ? "text-[var(--color-primary)]" : "text-[var(--color-icon-muted)] transition group-hover:text-[var(--color-text-secondary)]"}><NavIcon name={link.icon} /></span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function WorkspaceNav({ groups }: { groups: WorkspaceGroup[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const links = useMemo(() => groups.flatMap((group) => group.links), [groups]);
  const currentHref = links
    .filter((link) => matchesPath(pathname, link.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  useEffect(() => {
    if (!open) return;
    const trigger = menuButton.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab" && drawer.current) {
        const focusable = Array.from(drawer.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'));
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open]);

  const currentLabel = links.find((link) => link.href === currentHref)?.label ?? "Workspace";

  return (
    <nav className="mt-5 lg:mt-9" aria-label="Workspace navigation">
      <button
        ref={menuButton}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-workspace-navigation"
        className="flex min-h-12 w-full items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-4 text-left shadow-[var(--shadow-sm)] lg:hidden"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <NavIcon name={links.find((link) => link.href === currentHref)?.icon ?? "overview"} />
          </span>
          <span className="min-w-0"><span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Current page</span><span className="block truncate text-sm font-semibold text-[var(--color-text)]">{currentLabel}</span></span>
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-[var(--color-text-secondary)]" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>

      <div className="hidden lg:block">
        <NavigationGroups groups={groups} currentHref={currentHref} />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)} className="absolute inset-0 bg-[#101c3d]/45 backdrop-blur-[2px]" />
          <div ref={drawer} id="mobile-workspace-navigation" role="dialog" aria-modal="true" aria-labelledby={titleId} className="absolute inset-y-0 left-0 flex w-[min(88vw,360px)] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-5">
              <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">Flock workspace</p><h2 id={titleId} className="mt-1 text-lg font-semibold text-[var(--color-text)]">Navigation</h2></div>
              <button ref={closeButton} type="button" onClick={() => setOpen(false)} aria-label="Close navigation menu" className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6"><NavigationGroups groups={groups} currentHref={currentHref} onNavigate={() => setOpen(false)} /></div>
          </div>
        </div>
      )}
    </nav>
  );
}
