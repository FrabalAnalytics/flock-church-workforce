"use client";

import { useState } from "react";
import { deleteManagedUser } from "@/app/app/admin/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

export function DeleteUserAccountForm({
  id,
  fullName,
  roleLabel,
  returnTo,
}: {
  id: string;
  fullName: string;
  roleLabel: string;
  returnTo: string;
}) {
  const [confirmation, setConfirmation] = useState("");
  const confirmed = confirmation === fullName;

  return (
    <details className="mt-3 rounded-2xl border border-[#f0d7d4] bg-[#fff9f8] px-4 py-3">
      <summary className="cursor-pointer text-sm font-semibold text-[#a94740]">
        Delete {roleLabel} account
      </summary>
      <div className="pt-3">
        <p className="text-xs leading-5 text-[#7d5a57]">
          This permanently removes the person&apos;s sign-in account and workspace access. Historical attendance and audit records are retained. This cannot be undone.
        </p>
        <form
          action={deleteManagedUser}
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
          onSubmit={(event) => {
            if (!confirmed || !window.confirm(`Permanently delete ${fullName}'s ${roleLabel} account?`)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="return_to" value={returnTo} />
          <label className="text-xs font-semibold text-[#7d5a57]">
            Enter <span className="font-bold">{fullName}</span> to confirm
            <input
              name="confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
              autoComplete="off"
              className="mt-2 h-11 w-full rounded-xl border border-[#dfbbb7] bg-white px-3 text-sm font-normal text-[#34415f] outline-none focus:border-[#b5524b]"
            />
          </label>
          <FormSubmitButton
            disabled={!confirmed}
            pendingLabel="Deleting account..."
            className="h-11 rounded-xl bg-[#b5524b] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            Permanently delete
          </FormSubmitButton>
        </form>
      </div>
    </details>
  );
}
