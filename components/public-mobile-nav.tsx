"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const links = [
  ["Why Flock", "#why-flock"],
  ["Features", "#features"],
  ["Insights", "#insights"],
  ["How it works", "#how-it-works"],
];

export function PublicMobileNav() {
  const [open, setOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = menuButton.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab" && drawer.current) {
        const focusable = Array.from(drawer.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button ref={menuButton} type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="public-mobile-menu" aria-label="Open navigation menu" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dfe6f3] bg-white text-[#34415f] md:hidden">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[100] h-dvh overflow-hidden md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[#101c3d]/55"
          />
          <div
            ref={drawer}
            id="public-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-mobile-menu-title"
            className="absolute inset-y-0 right-0 flex h-dvh w-[min(88vw,360px)] flex-col overflow-hidden bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 py-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">Flock</p>
                <h2 id="public-mobile-menu-title" className="mt-1 text-lg font-semibold">Explore</h2>
              </div>
              <button ref={closeButton} type="button" onClick={() => setOpen(false)} aria-label="Close navigation menu" className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <nav aria-label="Mobile main navigation" className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <div className="space-y-2">
                {links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-xl px-4 text-base font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-strong)]">{label}</a>)}
              </div>
              <div className="mt-6 space-y-3 border-t border-[var(--color-border)] pt-6">
                <Link href="/sign-in" onClick={() => setOpen(false)} className="flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text)]">Sign in</Link>
                <Link href="/sign-up" onClick={() => setOpen(false)} className="flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-primary)] text-sm font-semibold text-white">Request access</Link>
              </div>
            </nav>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
