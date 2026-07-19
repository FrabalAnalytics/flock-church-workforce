"use client";

import { useFormStatus } from "react-dom";

export function FormSubmitButton({
  children,
  pendingLabel = "Saving...",
  className,
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      className={className}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
