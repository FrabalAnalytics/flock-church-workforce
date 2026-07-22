"use client";

import { useActionState, useState } from "react";
import {
  bulkImportWorkers,
  initialWorkerImportState,
} from "@/app/app/workers/import/actions";
import {
  validateWorkerImport,
  type WorkerImportPreviewRow,
} from "@/lib/worker-import-validation";

type Department = { id: string; name: string };

export function WorkerImport({
  departments,
  loadError,
}: {
  departments: Department[];
  loadError?: string;
}) {
  const [state, formAction, pending] = useActionState(bulkImportWorkers, initialWorkerImportState);
  const [fileName, setFileName] = useState("");
  const [previewRows, setPreviewRows] = useState<WorkerImportPreviewRow[]>([]);
  const [fileError, setFileError] = useState("");
  const validRows = previewRows.filter((row) => row.payload && !row.errors.length && !row.duplicate);
  const invalidRows = previewRows.filter((row) => row.errors.length);
  const duplicateRows = previewRows.filter((row) => row.duplicate);

  async function selectFile(file?: File) {
    setFileName(file?.name ?? "");
    setPreviewRows([]);
    setFileError("");
    if (!file) return;
    if (file.size > 600_000) {
      setFileError("The CSV is too large. Use a file smaller than 600 KB and no more than 500 data rows.");
      return;
    }

    try {
      const dateParts = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
      const dateValues = Object.fromEntries(dateParts.map((part) => [part.type, part.value]));
      const today = `${dateValues.year}-${dateValues.month}-${dateValues.day}`;
      setPreviewRows(validateWorkerImport(await file.text(), departments, today));
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "The CSV could not be read.");
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="grid gap-6 rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">1. Prepare the CSV</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Keep the template headings unchanged. Department names must match the directory, while blank status and joined-date cells default to Active and today.</p>
          <div className="mt-4 rounded-2xl bg-[var(--color-surface-subtle)] p-4 text-xs leading-5 text-[var(--color-text-secondary)]">
            <p className="font-semibold text-[var(--color-text)]">Required columns</p><p>full_name, department</p>
            <p className="mt-3 font-semibold text-[var(--color-text)]">Optional columns</p><p>phone_number, sex, status, joined_at, whatsapp_opt_in</p>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">2. Select and validate</h2>
          <label className="mt-4 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-5 text-center hover:border-[var(--color-primary)]">
            <span className="text-sm font-semibold text-[var(--color-primary-strong)]">Choose CSV file</span>
            <span className="mt-1 text-xs text-[var(--color-text-muted)]">Maximum 500 workers · 600 KB</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => void selectFile(event.target.files?.[0])} />
          </label>
          {fileName && <p className="mt-3 truncate text-xs font-medium text-[var(--color-text-secondary)]">Selected: {fileName}</p>}
          {(loadError || fileError) && <div role="alert" className="mt-3 rounded-xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{loadError ?? fileError}</div>}
        </div>
      </section>

      {previewRows.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-strong)]">{previewRows.length} rows read</span>
            <span className="rounded-full bg-[#edf7f1] px-3 py-1.5 text-xs font-semibold text-[#347457]">{validRows.length} ready</span>
            <span className="rounded-full bg-[var(--color-danger-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-danger)]">{invalidRows.length} invalid</span>
            <span className="rounded-full bg-[#fff3dc] px-3 py-1.5 text-xs font-semibold text-[#9a6818]">{duplicateRows.length} duplicate in file</span>
          </div>

          <section className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
            <div className="border-b border-[var(--color-border)] px-5 py-4"><h2 className="font-semibold text-[var(--color-text)]">Import preview</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Correct invalid rows in the CSV and select it again. Repeated file rows are skipped, and existing directory matches are checked during import.</p></div>
            <div className="max-h-[34rem] overflow-auto">
              <table className="min-w-[760px] w-full text-left">
                <thead className="sticky top-0 bg-[var(--color-surface-subtle)] text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]"><tr><th className="px-4 py-3">Row</th><th className="px-4 py-3">Worker</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Validation</th></tr></thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {previewRows.slice(0, 100).map((row) => <tr key={row.rowNumber}><td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">{row.rowNumber}</td><td className="px-4 py-3"><p className="text-sm font-semibold text-[var(--color-text)]">{row.fullName || "Name not provided"}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">{row.phoneNumber || "No phone"}</p></td><td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{row.departmentName || "Not provided"}</td><td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{row.status || "—"}</td><td className="px-4 py-3 text-xs"><span className={`font-semibold ${row.errors.length ? "text-[var(--color-danger)]" : row.duplicate ? "text-[#9a6818]" : "text-[#347457]"}`}>{row.errors.length ? row.errors.join(" ") : row.duplicate ? "Repeated row — skipped" : "Ready"}</span></td></tr>)}
                </tbody>
              </table>
            </div>
            {previewRows.length > 100 && <p className="border-t border-[var(--color-border)] px-5 py-3 text-xs text-[var(--color-text-muted)]">Showing the first 100 of {previewRows.length} rows.</p>}
          </section>

          <form action={formAction} onSubmit={(event) => { if (!window.confirm(`Import ${validRows.length} validated workers? Existing workers with the same name and department will be skipped.`)) event.preventDefault(); }} className="rounded-3xl border border-[#dbe5ff] bg-[#edf2ff] p-5 sm:flex sm:items-center sm:justify-between sm:gap-5">
            <input type="hidden" name="rows" value={JSON.stringify(validRows.map((row) => row.payload))} />
            <div><h2 className="font-semibold text-[var(--color-text)]">3. Import validated workers</h2><p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">The accepted records are imported together. If server validation fails, none are added.</p></div>
            <button type="submit" disabled={pending || !validRows.length || invalidRows.length > 0} className="mt-4 min-h-12 w-full rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto">{pending ? "Importing..." : `Import ${validRows.length} workers`}</button>
          </form>
        </>
      )}

      {state.status !== "idle" && <div role={state.status === "error" ? "alert" : "status"} className={`rounded-2xl px-5 py-4 text-sm font-medium ${state.status === "error" ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]" : "bg-[#edf7f1] text-[#347457]"}`}>{state.message}</div>}
    </div>
  );
}
