"use client";

import { useActionState, useMemo, useState } from "react";
import {
  bulkImportWorkers,
  initialWorkerImportState,
} from "@/app/app/workers/import/actions";

type Department = { id: string; name: string };
type ImportPayload = {
  full_name: string;
  phone_number: string;
  sex: string;
  department_id: string;
  status: string;
  joined_at: string;
  whatsapp_opt_in: boolean;
};
type PreviewRow = {
  rowNumber: number;
  fullName: string;
  phoneNumber: string;
  departmentName: string;
  status: string;
  payload: ImportPayload | null;
  errors: string[];
  duplicate: boolean;
};

const requiredHeaders = ["full_name", "department"];
const acceptedHeaders = new Set([
  "full_name",
  "phone_number",
  "sex",
  "department",
  "status",
  "joined_at",
  "whatsapp_opt_in",
]);

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error("The CSV contains an unclosed quoted value.");
  row.push(field.replace(/\r$/, ""));
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function normalizeStatus(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "active") return "Active";
  if (normalized === "inactive") return "Inactive";
  if (normalized === "on leave" || normalized === "on_leave") return "On Leave";
  return null;
}

function normalizeSex(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "male") return "Male";
  if (normalized === "female") return "Female";
  return null;
}

function normalizeConsent(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || ["false", "no", "0"].includes(normalized)) return false;
  if (["true", "yes", "1"].includes(normalized)) return true;
  return null;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function WorkerImport({
  departments,
  loadError,
}: {
  departments: Department[];
  loadError?: string;
}) {
  const [state, formAction, pending] = useActionState(bulkImportWorkers, initialWorkerImportState);
  const [fileName, setFileName] = useState("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [fileError, setFileError] = useState("");
  const departmentsByName = useMemo(
    () => new Map(departments.map((department) => [department.name.trim().toLowerCase(), department])),
    [departments],
  );
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
      const parsed = parseCsv(await file.text());
      if (parsed.length < 2) throw new Error("The CSV must contain a header row and at least one worker.");
      const headers = parsed[0].map(normalizeHeader);
      const missing = requiredHeaders.filter((header) => !headers.includes(header));
      if (missing.length) throw new Error(`Missing required ${missing.length === 1 ? "column" : "columns"}: ${missing.join(", ")}.`);
      if (new Set(headers).size !== headers.length) throw new Error("The CSV contains duplicate column headings.");
      const unknown = headers.filter((header) => !acceptedHeaders.has(header));
      if (unknown.length) throw new Error(`Unknown ${unknown.length === 1 ? "column" : "columns"}: ${unknown.join(", ")}.`);
      const dataRows = parsed.slice(1);
      if (dataRows.length > 500) throw new Error("Import no more than 500 workers at a time.");
      const seen = new Set<string>();
      const dateParts = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
      const dateValues = Object.fromEntries(dateParts.map((part) => [part.type, part.value]));
      const today = `${dateValues.year}-${dateValues.month}-${dateValues.day}`;
      const rows = dataRows.map((values, index): PreviewRow => {
        const record = Object.fromEntries(headers.map((header, column) => [header, values[column]?.trim() ?? ""]));
        const errors: string[] = [];
        if (values.length !== headers.length) errors.push(`Expected ${headers.length} columns but found ${values.length}.`);
        const fullName = record.full_name;
        const phoneNumber = record.phone_number ?? "";
        const departmentName = record.department;
        const department = departmentsByName.get(departmentName.toLowerCase());
        const sex = normalizeSex(record.sex ?? "");
        const status = normalizeStatus(record.status ?? "");
        const joinedAt = record.joined_at || today;
        const consent = normalizeConsent(record.whatsapp_opt_in ?? "");
        if (fullName.length < 2 || fullName.length > 120) errors.push("Full name must contain 2–120 characters.");
        if (phoneNumber.length > 40) errors.push("Phone number cannot exceed 40 characters.");
        if (!department) errors.push(`Department “${departmentName || "blank"}” does not match the directory.`);
        if (sex === null) errors.push("Sex must be Male, Female, or blank.");
        if (status === null) errors.push("Status must be Active, Inactive, or On Leave.");
        if (!isValidDate(joinedAt) || joinedAt > today) errors.push("Joined date must be a valid date that is not in the future.");
        if (consent === null) errors.push("WhatsApp consent must be Yes, No, True, False, 1, 0, or blank.");
        if (consent === true && !phoneNumber) errors.push("A phone number is required when WhatsApp consent is Yes.");
        const duplicateKey = department ? `${department.id}:${fullName.toLowerCase()}` : "";
        const duplicate = Boolean(duplicateKey && seen.has(duplicateKey));
        if (duplicateKey) seen.add(duplicateKey);
        return {
          rowNumber: index + 2,
          fullName,
          phoneNumber,
          departmentName,
          status: status ?? record.status ?? "",
          errors,
          duplicate,
          payload: errors.length || !department || sex === null || status === null || consent === null
            ? null
            : {
                full_name: fullName,
                phone_number: phoneNumber,
                sex,
                department_id: department.id,
                status,
                joined_at: joinedAt,
                whatsapp_opt_in: consent,
              },
        };
      });
      setPreviewRows(rows);
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
