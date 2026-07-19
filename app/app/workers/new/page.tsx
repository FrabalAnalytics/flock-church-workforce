import { createWorker } from "@/app/app/admin/actions";
import { WorkerForm } from "@/components/worker-form";
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export default async function NewWorkerPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireSuperAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("departments").select("id, name").order("name");
  return <WorkerForm action={createWorker} departments={data ?? []} error={params.error} />;
}
