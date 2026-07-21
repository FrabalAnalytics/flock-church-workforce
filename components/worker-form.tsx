import Link from "next/link";
import { FormSubmitButton } from "@/components/form-submit-button";
import { WorkspaceNotice } from "@/components/workspace-notice";
import { PageHeader } from "@/components/workspace-ui";

type Department = { id: string; name: string };
type Worker = { id: string; full_name: string; phone_number: string | null; sex: string | null; department_id: string; status: string; joined_at: string; whatsapp_opt_in: boolean };

export function WorkerForm({ action, departments, worker, error }: { action: (formData: FormData) => void | Promise<void>; departments: Department[]; worker?: Worker; error?: string }) {
  return (
    <div className="mx-auto max-w-4xl">
      <WorkspaceNotice error={error} />
      <Link href="/app/workers" className="mb-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)]">← Back to worker directory</Link>
      <PageHeader eyebrow="Worker directory" title={worker ? "Edit worker" : "Add worker"} description="Maintain the workforce roster used for worker attendance and pastoral-care follow-up." />
      <form action={action} className="mt-8 grid gap-5 rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:grid-cols-2 sm:p-8">
        {worker && <input type="hidden" name="id" value={worker.id} />}
        <div className="sm:col-span-2"><h2 className="text-base font-semibold text-[var(--color-text)]">Personal details</h2><p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">Basic information used to identify and contact this worker.</p></div>
        <label className="text-sm font-semibold text-[var(--color-text-secondary)] sm:col-span-2">Full name<input className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" name="full_name" required defaultValue={worker?.full_name} /></label>
        <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Phone number<input className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" name="phone_number" type="tel" inputMode="tel" autoComplete="tel" placeholder="e.g. +234 801 234 5678" defaultValue={worker?.phone_number ?? ""} /><span className="mt-1.5 block text-xs font-normal text-[var(--color-text-muted)]">Include the country code for care messaging.</span></label>
        <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Sex <span className="font-normal text-[var(--color-text-muted)]">(optional)</span><select className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" name="sex" defaultValue={worker?.sex ?? ""}><option value="">Not recorded</option><option value="Male">Male</option><option value="Female">Female</option></select></label>
        <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Joined date<input className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" name="joined_at" type="date" required defaultValue={worker?.joined_at ?? new Date().toISOString().slice(0, 10)} /></label>
        <div className="border-t border-[var(--color-border)] pt-5 sm:col-span-2"><h2 className="text-base font-semibold text-[var(--color-text)]">Roster assignment</h2><p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">Only active workers appear on department attendance checklists.</p></div>
        <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Department<select className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" name="department_id" required defaultValue={worker?.department_id ?? ""}><option value="" disabled>Select department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
        <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Roster status<select className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm font-normal outline-none focus:border-[var(--color-primary)]" name="status" defaultValue={worker?.status ?? "Active"}><option>Active</option><option>On Leave</option><option>Inactive</option></select></label>
        <div className="border-t border-[var(--color-border)] pt-5 sm:col-span-2"><h2 className="text-base font-semibold text-[var(--color-text)]">Communication consent</h2><p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">Consent must be explicit and can be withdrawn at any time.</p></div>
        <label className="flex min-h-20 cursor-pointer items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 sm:col-span-2"><input type="checkbox" name="whatsapp_opt_in" defaultChecked={worker?.whatsapp_opt_in} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]" /><span><span className="block text-sm font-semibold text-[var(--color-text)]">WhatsApp care consent recorded</span><span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">Confirm only when the worker has agreed to receive care messages. Recording consent does not activate delivery while WhatsApp messaging remains paused.</span></span></label>
        <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-border)] pt-5 sm:col-span-2 sm:flex-row sm:justify-end">
          <Link href="/app/workers" className="flex min-h-12 w-full items-center justify-center rounded-xl border border-[var(--color-border)] px-5 text-sm font-semibold text-[var(--color-text-secondary)] sm:w-auto">Cancel</Link>
          <FormSubmitButton pendingLabel={worker ? "Saving changes…" : "Adding worker…"} className="min-h-12 w-full rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)] disabled:opacity-60 sm:w-auto">{worker ? "Save changes" : "Add worker"}</FormSubmitButton>
        </div>
      </form>
    </div>
  );
}
