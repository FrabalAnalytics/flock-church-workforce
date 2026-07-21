"use client";

import { useState } from "react";
import { updateUserAccess } from "@/app/app/admin/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

type Role = "pending" | "super_admin" | "church_leader" | "department_head";
type Department = { id: string; name: string };

const roleHelp: Record<Role, string> = {
  pending: "Cannot enter the workspace until approved.",
  department_head: "Manages attendance and follow-up for one department.",
  church_leader: "Reviews church-wide attendance, programmes and care alerts.",
  super_admin: "Full access to people, structure and system administration.",
};

const roleLabels: Record<Role, string> = {
  pending: "Pending",
  department_head: "Department Head",
  church_leader: "Church Leader",
  super_admin: "Super Admin",
};

export function UserAccessForm({
  id,
  fullName,
  initialRole,
  initialDepartmentId,
  departments,
  isCurrentUser,
  returnTo,
}: {
  id: string;
  fullName: string;
  initialRole: Role;
  initialDepartmentId: string | null;
  departments: Department[];
  isCurrentUser: boolean;
  returnTo: string;
}) {
  const [role, setRole] = useState<Role>(initialRole);
  const [departmentId, setDepartmentId] = useState(initialDepartmentId ?? "");
  const needsDepartment = role === "department_head";
  const effectiveDepartment = needsDepartment ? departmentId : "";
  const initialEffectiveDepartment = initialRole === "department_head" ? initialDepartmentId ?? "" : "";
  const hasChanges = role !== initialRole || effectiveDepartment !== initialEffectiveDepartment;
  const departmentName = departments.find((department) => department.id === departmentId)?.name ?? "Not assigned";

  function confirmChange(event: React.FormEvent<HTMLFormElement>) {
    if (!hasChanges) {
      event.preventDefault();
      return;
    }
    const details = [`Role: ${roleLabels[initialRole]} → ${roleLabels[role]}`];
    if (effectiveDepartment !== initialEffectiveDepartment) details.push(`Department: ${departmentName}`);
    const warning = role === "super_admin"
      ? "This grants full administrative access."
      : initialRole === "super_admin"
        ? "This removes full administrative access."
        : role === "pending"
          ? "This removes workspace access until the account is approved again."
          : "The change applies on the user's next authenticated request.";
    if (!window.confirm(`Save access changes for ${fullName}?\n\n${details.join("\n")}\n\n${warning}`)) {
      event.preventDefault();
    }
  }

  return (
    <form action={updateUserAccess} onSubmit={confirmChange} className="grid gap-4 rounded-2xl bg-[var(--color-surface-subtle)] p-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto] xl:items-end">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="return_to" value={returnTo} />
      {isCurrentUser && <input type="hidden" name="role" value="super_admin" />}
      <label className="text-sm font-semibold text-[var(--color-text-secondary)]">
        Role
        <select name={isCurrentUser ? undefined : "role"} value={role} disabled={isCurrentUser} onChange={(event) => setRole(event.target.value as Role)} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal disabled:cursor-not-allowed disabled:bg-[#eef1f6]">
          <option value="pending">Pending</option>
          <option value="department_head">Department Head</option>
          <option value="church_leader">Church Leader</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <span className="mt-1.5 block text-xs font-normal leading-5 text-[var(--color-text-muted)]">{isCurrentUser ? "You cannot remove your own Super Admin access." : roleHelp[role]}</span>
      </label>
      <label className="text-sm font-semibold text-[var(--color-text-secondary)]">
        Department {needsDepartment && <span className="text-[var(--color-danger)]">Required</span>}
        <select name="department_id" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} required={needsDepartment} disabled={!needsDepartment} className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-normal disabled:cursor-not-allowed disabled:bg-[#eef1f6] disabled:text-[var(--color-text-muted)]">
          <option value="">{needsDepartment ? "Select department" : "Not required for this role"}</option>
          {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
        </select>
        <span className="mt-1.5 block text-xs font-normal leading-5 text-[var(--color-text-muted)]">{needsDepartment ? "Controls the roster this user can access." : "Only Department Heads are assigned to a department."}</span>
      </label>
      <FormSubmitButton disabled={!hasChanges} pendingLabel="Saving access..." className="min-h-12 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-45 sm:col-span-2 xl:col-span-1">{hasChanges ? "Review and save" : "No changes"}</FormSubmitButton>
    </form>
  );
}
