import { notFound } from "next/navigation";
import { updateWorker } from "@/app/app/admin/actions";
import { WorkerForm } from "@/components/worker-form";
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export default async function EditWorkerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireSuperAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [{ data: worker }, { data: departments }] = await Promise.all([
    supabase.from("workers").select("id, full_name, phone_number, department_id, status, joined_at, whatsapp_opt_in").eq("id", id).single(),
    supabase.from("departments").select("id, name").order("name"),
  ]);
  if (!worker) notFound();
  return <WorkerForm action={updateWorker} worker={worker} departments={departments ?? []} error={query.error} />;
}
