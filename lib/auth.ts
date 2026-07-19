import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfileRole =
  | "pending"
  | "super_admin"
  | "church_leader"
  | "department_head";

export type Profile = {
  id: string;
  full_name: string;
  phone_number: string | null;
  role: ProfileRole;
  department_id: string | null;
};

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
});

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone_number, role, department_id")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
});

export async function requireProfile() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const profile = await getCurrentProfile();
  if (!profile) redirect("/pending?reason=profile");

  return { user, profile };
}
