"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWorkspaceOwner } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function destination(type: "message" | "error", message: string) {
  return `/workspace?${type}=${encodeURIComponent(message)}`;
}

export async function createChurchWorkspace(formData: FormData) {
  await requireWorkspaceOwner();
  const legalName = value(formData, "legal_name");
  const displayName = value(formData, "display_name") || legalName;
  const timezone = value(formData, "timezone") || "Africa/Lagos";

  if (legalName.length < 2 || displayName.length < 2) {
    redirect(destination("error", "Enter a valid church name."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_church_workspace", {
    p_legal_name: legalName,
    p_display_name: displayName,
    p_timezone: timezone,
  });
  if (error) redirect(destination("error", error.message));

  revalidatePath("/workspace");
  redirect(destination("message", `Church created successfully.`));
}

export async function createBranchWorkspace(formData: FormData) {
  await requireWorkspaceOwner();
  const churchId = value(formData, "church_id");
  const name = value(formData, "name");
  const code = value(formData, "code");
  const timezone = value(formData, "timezone");

  if (!churchId || name.length < 2 || code.length < 2) {
    redirect(destination("error", "Enter a valid branch name and code."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_branch_workspace", {
    p_church_id: churchId,
    p_name: name,
    p_code: code,
    p_timezone: timezone || null,
  });
  if (error) redirect(destination("error", error.message));

  revalidatePath("/workspace");
  redirect(destination("message", `${name} branch created.`));
}
