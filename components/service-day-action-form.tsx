"use client";

import type { ReactNode } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";

export function ServiceDayActionForm({
  action,
  fields,
  confirmation,
  children,
  pendingLabel,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  confirmation: string;
  children: ReactNode;
  pendingLabel: string;
  className: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmation)) event.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <FormSubmitButton pendingLabel={pendingLabel} className={className}>
        {children}
      </FormSubmitButton>
    </form>
  );
}
