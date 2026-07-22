"use client";

import { useState } from "react";
import { inviteManagedUser } from "@/app/app/admin/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import type { InvitationRole } from "@/lib/user-invitation";

type Department = { id: string; name: string };

const roleLabels: Record<InvitationRole, string> = {
  church_leader: "Church Leader",
  department_head: "Department Head",
  super_admin: "Super Admin",
};

export function InviteUserForm({ departments }: { departments: Department[] }) {
  const [role, setRole] = useState<InvitationRole>("church_leader");
  const needsDepartment = role === "department_head";

  return (
    <details className="mt-6 overflow-hidden rounded-3xl border border-[#d9e3fb] bg-white shadow-[var(--shadow-sm)]">
      <summary className="cursor-pointer list-none bg-[#f4f7ff] px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div><p className="font-semibold text-[#304d91]">Invite a new workspace user</p><p className="mt-1 text-xs leading-5 text-[#687ba4]">Send a secure invitation and assign access before the person signs in.</p></div>
          <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)]">New invitation</span>
        </div>
      </summary>
      <form
        action={inviteManagedUser}
        className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3"
        onSubmit={(event) => {
          if (role === "super_admin" && !window.confirm("Invite this person as a Super Admin? They will receive full access to people, records, configuration and account management.")) {
            event.preventDefault();
          }
        }}
      >
        <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Full name<input name="full_name" required minLength={2} maxLength={120} autoComplete="name" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
        <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Email address<input name="email" type="email" required maxLength={254} autoComplete="email" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
        <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Phone number <span className="font-normal text-[var(--color-text-muted)]">Optional</span><input name="phone_number" type="tel" maxLength={40} autoComplete="tel" className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" /></label>
        <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Role<select name="role" value={role} onChange={(event) => setRole(event.target.value as InvitationRole)} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal"><option value="church_leader">Church Leader</option><option value="department_head">Department Head</option><option value="super_admin">Super Admin</option></select></label>
        <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Department {needsDepartment && <span className="text-[var(--color-danger)]">Required</span>}<select name="department_id" required={needsDepartment} disabled={!needsDepartment} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal disabled:cursor-not-allowed disabled:bg-[#eef1f6] disabled:text-[var(--color-text-muted)]"><option value="">{needsDepartment ? "Select department" : "Not required for this role"}</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
        <div className="flex flex-col justify-end"><FormSubmitButton pendingLabel="Sending invitation..." className="min-h-12 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)] disabled:cursor-wait disabled:opacity-60">Invite {roleLabels[role]}</FormSubmitButton></div>
        <p className="text-xs leading-5 text-[var(--color-text-muted)] sm:col-span-2 xl:col-span-3">The recipient will use the emailed link to verify their identity and choose a password. The invitation can only work when the production URL is allowed in Supabase Auth redirect settings.</p>
      </form>
    </details>
  );
}
