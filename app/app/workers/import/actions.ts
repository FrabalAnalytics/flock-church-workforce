"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export type WorkerImportState = {
  status: "idle" | "success" | "error";
  message: string;
  inserted?: number;
  skipped?: number;
};

export const initialWorkerImportState: WorkerImportState = {
  status: "idle",
  message: "",
};

export async function bulkImportWorkers(
  _previousState: WorkerImportState,
  formData: FormData,
): Promise<WorkerImportState> {
  await requireSuperAdmin();
  const rawPayload = String(formData.get("rows") ?? "");

  if (!rawPayload || rawPayload.length > 750_000) {
    return { status: "error", message: "The import is empty or too large. Import no more than 500 workers at once." };
  }

  let rows: unknown;
  try {
    rows = JSON.parse(rawPayload);
  } catch {
    return { status: "error", message: "The worker import payload could not be read. Select the CSV file again." };
  }

  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 500) {
    return { status: "error", message: "Import between 1 and 500 valid workers at a time." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("bulk_import_workers", { p_rows: rows });
  if (error) return { status: "error", message: error.message };

  const result = (data ?? {}) as { inserted?: number; skipped?: number };
  const inserted = Number(result.inserted ?? 0);
  const skipped = Number(result.skipped ?? 0);
  revalidatePath("/app/workers");
  revalidatePath("/app/audit");
  return {
    status: "success",
    message: `${inserted} ${inserted === 1 ? "worker was" : "workers were"} imported${skipped ? ` and ${skipped} existing ${skipped === 1 ? "record was" : "records were"} skipped` : ""}.`,
    inserted,
    skipped,
  };
}
