import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";

export async function requireSuperAdmin() {
  const session = await requireProfile();
  if (session.profile.role === "pending") redirect("/pending");
  if (session.profile.role !== "super_admin") redirect("/app");
  return session;
}
