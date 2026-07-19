"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "@/components/auth-form";

export function AuthSubmitButton({
  idleLabel,
  pendingLabel,
}: {
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`${buttonClass} disabled:cursor-wait disabled:opacity-70`}
      type="submit"
      disabled={pending}
      aria-disabled={pending}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {pending && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/45 border-t-white" />
        )}
        {pending ? pendingLabel : idleLabel}
      </span>
    </button>
  );
}
