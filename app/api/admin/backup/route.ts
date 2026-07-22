import { BACKUP_FORMAT_VERSION, BACKUP_TABLES, backupFilename } from "@/lib/data-backup";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PAGE_SIZE = 1000;

async function readAllRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: (typeof BACKUP_TABLES)[number],
) {
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Could not export ${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

export async function GET() {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  if (!user || !profile) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }
  if (profile.role !== "super_admin") {
    return Response.json({ error: "Super Admin access required." }, { status: 403 });
  }

  try {
    const supabase = await createClient();
    const dataEntries = await Promise.all(
      BACKUP_TABLES.map(async (table) => [table, await readAllRows(supabase, table)] as const),
    );
    const data = Object.fromEntries(dataEntries);
    const settings = (data.church_settings as Array<{ church_name?: string }>)[0];
    const generatedAt = new Date();
    const body = JSON.stringify({
      format: "flock-data-backup",
      format_version: BACKUP_FORMAT_VERSION,
      generated_at: generatedAt.toISOString(),
      generated_by: { id: profile.id, full_name: profile.full_name },
      record_counts: Object.fromEntries(dataEntries.map(([table, rows]) => [table, rows.length])),
      data,
    });

    return new Response(body, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `attachment; filename="${backupFilename(settings?.church_name ?? "Flock Church", generatedAt)}"`,
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Flock backup generation failed", error);
    return Response.json(
      { error: "The backup could not be generated. Confirm that all database migrations are installed and try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
