import Link from "next/link";
import { WorkerImport } from "@/components/worker-import";
import { PageHeader } from "@/components/workspace-ui";
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Import workers",
  description: "Validate and import worker-directory records from CSV.",
};

export default async function ImportWorkersPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data: departments, error } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  return (
    <div className="mx-auto max-w-7xl">
      <Link href="/app/workers" className="mb-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)]">← Back to worker directory</Link>
      <PageHeader
        eyebrow="Worker directory"
        title="Import workers"
        description="Upload a CSV file, resolve validation issues, preview the accepted records, and import the batch in one transaction."
        actions={<a href="/worker-import-template.csv" download className="flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-5 text-sm font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-sm)]">Download CSV template</a>}
      />
      <WorkerImport departments={departments ?? []} loadError={error?.message} />
    </div>
  );
}
