"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { validateInvitationInput } from "@/lib/user-invitation";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function withMessage(path: string, type: "message" | "error", text: string) {
  return `${path}?${type}=${encodeURIComponent(text)}`;
}

function safeUsersReturnPath(value: string) {
  try {
    const url = new URL(value, "https://flock.local");
    if (url.origin !== "https://flock.local" || url.pathname !== "/app/users") return "/app/users";
    const params = new URLSearchParams();
    const query = url.searchParams.get("q");
    const role = url.searchParams.get("role");
    const department = url.searchParams.get("department");
    if (query) params.set("q", query.slice(0, 120));
    if (["pending", "church_leader", "department_head", "super_admin"].includes(role ?? "")) params.set("role", role!);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(department ?? "")) params.set("department", department!);
    return `/app/users${params.size ? `?${params}` : ""}`;
  } catch {
    return "/app/users";
  }
}

function usersDestination(returnTo: string, type: "message" | "error", text: string) {
  return `${returnTo}${returnTo.includes("?") ? "&" : "?"}${type}=${encodeURIComponent(text)}`;
}

async function applicationOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configuredOrigin) {
    const configuredUrl = new URL(configuredOrigin);
    if (configuredUrl.protocol !== "https:" && configuredUrl.hostname !== "localhost") {
      throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS in production.");
    }
    return configuredUrl.origin;
  }

  const vercelHost = (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL)?.trim();
  if (vercelHost) return `https://${vercelHost}`;
  const requestOrigin = (await headers()).get("origin");
  if (requestOrigin) return new URL(requestOrigin).origin;
  throw new Error("The public application URL is not configured.");
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
  const returnTo = safeUsersReturnPath(value(formData, "return_to"));
  const { user } = await requireSuperAdmin();
  const id = value(formData, "id");
  const role = value(formData, "role");
  const department_id = value(formData, "department_id") || null;
  if (!id || !["pending", "church_leader", "department_head", "super_admin"].includes(role)) {
    redirect(usersDestination(returnTo, "error", "Select a valid role."));
  }
  if (id === user.id && role !== "super_admin") {
    redirect(usersDestination(returnTo, "error", "You cannot remove your own Super Admin access."));
  }
  if (role === "department_head" && !department_id) {
    redirect(usersDestination(returnTo, "error", "Department Heads must be assigned a department."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role, department_id: role === "department_head" ? department_id : null }).eq("id", id);
  if (error) redirect(usersDestination(returnTo, "error", error.message));
  revalidatePath("/app", "layout");
  redirect(usersDestination(returnTo, "message", "User access updated."));
}

export async function inviteManagedUser(formData: FormData) {
  await requireSuperAdmin();
  const validated = validateInvitationInput({
    fullName: value(formData, "full_name"),
    email: value(formData, "email"),
    phoneNumber: value(formData, "phone_number"),
    role: value(formData, "role"),
    departmentId: value(formData, "department_id"),
  });
  if (!validated.value) redirect(withMessage("/app/users", "error", validated.error));
  const invitation = validated.value;

  let admin;
  let inviteResult;
  try {
    admin = createAdminClient();
    inviteResult = await admin.auth.admin.inviteUserByEmail(invitation.email, {
      redirectTo: `${await applicationOrigin()}/auth/invite`,
      data: {
        full_name: invitation.fullName,
        phone_number: invitation.phoneNumber,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The invitation service could not be reached.";
    redirect(withMessage("/app/users", "error", message));
  }

  if (inviteResult.error || !inviteResult.data.user) {
    redirect(withMessage("/app/users", "error", inviteResult.error?.message ?? "The invitation account was not created."));
  }

  const invitedUserId = inviteResult.data.user.id;
  const supabase = await createClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      role: invitation.role,
      department_id: invitation.departmentId,
      full_name: invitation.fullName,
      phone_number: invitation.phoneNumber,
      email: invitation.email,
    })
    .eq("id", invitedUserId);

  if (profileError) {
    await admin.auth.admin.deleteUser(invitedUserId);
    redirect(withMessage("/app/users", "error", `Invitation cancelled because access assignment failed: ${profileError.message}`));
  }

  revalidatePath("/app", "layout");
  revalidatePath("/app/action-centre");
  redirect(withMessage("/app/users", "message", `Invitation sent to ${invitation.email}.`));
}

export async function deleteManagedUser(formData: FormData) {
  const returnTo = safeUsersReturnPath(value(formData, "return_to"));
  const { user } = await requireSuperAdmin();
  const id = value(formData, "id");
  const confirmation = value(formData, "confirmation");

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    redirect(usersDestination(returnTo, "error", "Select a valid account."));
  }
  if (id === user.id) {
    redirect(usersDestination(returnTo, "error", "You cannot delete your own account."));
  }
  if (confirmation.length < 2 || confirmation.length > 120) {
    redirect(usersDestination(returnTo, "error", "Enter the account holder's exact full name."));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("delete_managed_user", {
    p_user_id: id,
    p_confirmation: confirmation,
  });
  if (error) redirect(usersDestination(returnTo, "error", error.message));

  revalidatePath("/app", "layout");
  revalidatePath("/app/audit");
  const deletedName = typeof data === "string" && data ? data : "The account";
  redirect(usersDestination(returnTo, "message", `${deletedName} was permanently deleted.`));
}
