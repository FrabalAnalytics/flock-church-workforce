"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function ApprovalStatusButton() {
  const router = useRouter();
  const [checking, startChecking] = useTransition();

  return (
    <button
      type="button"
      disabled={checking}
      onClick={() => startChecking(() => router.refresh())}
      className="min-h-12 w-full rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(79,125,243,0.2)] transition hover:bg-[var(--color-primary-strong)] disabled:cursor-wait disabled:opacity-65 sm:w-auto"
    >
      {checking ? "Checking approval..." : "Check approval status"}
    </button>
  );
}
