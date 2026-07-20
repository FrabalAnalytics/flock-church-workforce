"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function withMessage(path: string, type: "message" | "error", text: string) {
  return `${path}?${type}=${encodeURIComponent(text)}`;
}

export async function createDepartment(formData: FormData) {
  await requireSuperAdmin();
  const name = value(formData, "name");
  if (name.length < 2) redirect(withMessage("/app/departments", "error", "Enter a department name."));

  const supabase = await createClient();
  const { error } = await supabase.from("departments").insert({ name });
  if (error) redirect(withMessage("/app/departments", "error", error.message));
  revalidatePath("/app/departments");
  redirect(withMessage("/app/departments", "message", `${name} was added.`));
}

export async function renameDepartment(formData: FormData) {
  await requireSuperAdmin();
  const id = value(formData, "id");
  const name = value(formData, "name");
  if (!id || name.length < 2) redirect(withMessage("/app/departments", "error", "Enter a valid department name."));

  const supabase = await createClient();
  const { error } = await supabase.from("departments").update({ name }).eq("id", id);
  if (error) redirect(withMessage("/app/departments", "error", error.message));
  revalidatePath("/app", "layout");
  redirect(withMessage("/app/departments", "message", "Department updated."));
}

export async function createMinister(formData: FormData) {
  await requireSuperAdmin();
  const title = value(formData, "title") || null;
  const full_name = value(formData, "full_name");
  if (full_name.length < 2 || full_name.length > 120 || (title && title.length > 40)) {
    redirect(withMessage("/app/ministers", "error", "Enter a valid minister name and title."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ministers").insert({ title, full_name });
  if (error) redirect(withMessage("/app/ministers", "error", error.message));
  revalidatePath("/app/ministers");
  revalidatePath("/app/church-attendance");
  redirect(withMessage("/app/ministers", "message", `${title ? `${title} ` : ""}${full_name} was added.`));
}

export async function updateMinister(formData: FormData) {
  await requireSuperAdmin();
  const id = value(formData, "id");
  const title = value(formData, "title") || null;
  const full_name = value(formData, "full_name");
  const active = formData.get("active") === "on";
  if (!id || full_name.length < 2 || full_name.length > 120 || (title && title.length > 40)) {
    redirect(withMessage("/app/ministers", "error", "Enter valid minister details."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ministers").update({ title, full_name, active, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect(withMessage("/app/ministers", "error", error.message));
  revalidatePath("/app/ministers");
  revalidatePath("/app/church-attendance");
  redirect(withMessage("/app/ministers", "message", "Minister updated."));
}

export async function createWorker(formData: FormData) {
  await requireSuperAdmin();
  const full_name = value(formData, "full_name");
  const phone_number = value(formData, "phone_number") || null;
  const sex = value(formData, "sex") || null;
  const department_id = value(formData, "department_id");
  const status = value(formData, "status") || "Active";
  const joined_at = value(formData, "joined_at");
  const whatsapp_opt_in = formData.get("whatsapp_opt_in") === "on";
  if (full_name.length < 2 || !department_id || (sex && !["Male", "Female"].includes(sex))) redirect(withMessage("/app/workers/new", "error", "Enter valid worker details."));

  const supabase = await createClient();
  const { error } = await supabase.from("workers").insert({ full_name, phone_number, sex, department_id, status, joined_at: joined_at || undefined, whatsapp_opt_in });
  if (error) redirect(withMessage("/app/workers/new", "error", error.message));
  revalidatePath("/app/workers");
  redirect(withMessage("/app/workers", "message", `${full_name} was added.`));
}

export async function updateWorker(formData: FormData) {
  await requireSuperAdmin();
  const id = value(formData, "id");
  const full_name = value(formData, "full_name");
  const phone_number = value(formData, "phone_number") || null;
  const sex = value(formData, "sex") || null;
  const department_id = value(formData, "department_id");
  const status = value(formData, "status");
  const joined_at = value(formData, "joined_at");
  const whatsapp_opt_in = formData.get("whatsapp_opt_in") === "on";
  if (!id || full_name.length < 2 || !department_id || (sex && !["Male", "Female"].includes(sex))) redirect(withMessage(`/app/workers/${id}/edit`, "error", "Complete all required fields with valid values."));

  const supabase = await createClient();
  const { error } = await supabase.from("workers").update({ full_name, phone_number, sex, department_id, status, joined_at, whatsapp_opt_in }).eq("id", id);
  if (error) redirect(withMessage(`/app/workers/${id}/edit`, "error", error.message));
  revalidatePath("/app/workers");
  redirect(withMessage("/app/workers", "message", `${full_name} was updated.`));
}

export async function updateUserAccess(formData: FormData) {
  const { user } = await requireSuperAdmin();
  const id = value(formData, "id");
  const role = value(formData, "role");
  const department_id = value(formData, "department_id") || null;
  if (!id || !["pending", "church_leader", "department_head", "super_admin"].includes(role)) {
    redirect(withMessage("/app/users", "error", "Select a valid role."));
  }
  if (id === user.id && role !== "super_admin") {
    redirect(withMessage("/app/users", "error", "You cannot remove your own Super Admin access."));
  }
  if (role === "department_head" && !department_id) {
    redirect(withMessage("/app/users", "error", "Department Heads must be assigned a department."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role, department_id: role === "department_head" ? department_id : null }).eq("id", id);
  if (error) redirect(withMessage("/app/users", "error", error.message));
  revalidatePath("/app", "layout");
  redirect(withMessage("/app/users", "message", "User access updated."));
}
