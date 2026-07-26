import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";

export async function requireSuperAdmin() {
  const session = await requireProfile();
  if (session.profile.role === "pending") redirect("/pending");
  if (session.profile.role === "workspace_owner") redirect("/workspace");
  if (session.profile.role !== "super_admin") redirect("/app");
  return session;
}

export async function requireWorkspaceOwner() {
  const session = await requireProfile();
  if (session.profile.role === "pending") redirect("/pending");
  if (session.profile.role !== "workspace_owner") redirect("/app");
  return session;
}
