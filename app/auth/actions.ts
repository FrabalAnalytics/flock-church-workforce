"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function message(value: string) {
  return encodeURIComponent(value);
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function origin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configuredOrigin) {
    const configuredUrl = new URL(configuredOrigin);
    if (configuredUrl.protocol !== "https:" && configuredUrl.hostname !== "localhost") {
      throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS in production.");
    }
    return configuredUrl.origin;
  }

  const vercelHost = (
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
  )?.trim();
  if (vercelHost) return `https://${vercelHost}`;

  const requestHeaders = await headers();
  const requestOrigin = requestHeaders.get("origin");
  if (requestOrigin) return new URL(requestOrigin).origin;

  throw new Error("The public application URL is not configured.");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app");

  if (!validEmail(email) || !password) {
    redirect(`/sign-in?error=${message("Enter a valid email and password.")}`);
  }

  const supabase = await createClient();
  let authResult;

  try {
    authResult = await supabase.auth.signInWithPassword({ email, password });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown connection error";
    redirect(
      `/sign-in?error=${message(`Could not reach the authentication service. ${detail}`)}`,
    );
  }

  if (authResult.error) {
    redirect(`/sign-in?error=${message(authResult.error.message)}`);
  }
  if (!authResult.data.session || !authResult.data.user) {
    redirect(
      `/sign-in?error=${message("Sign-in completed without creating a session. Please try again.")}`,
    );
  }

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/app");
}

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phoneNumber = String(formData.get("phone_number") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (fullName.length < 2 || !validEmail(email)) {
    redirect(`/sign-up?error=${message("Enter your full name and a valid email.")}`);
  }
  if (password.length < 8 || password !== confirmPassword) {
    redirect(`/sign-up?error=${message("Passwords must match and contain at least 8 characters.")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await origin()}/auth/callback`,
      data: { full_name: fullName, phone_number: phoneNumber || null },
    },
  });

  if (error) redirect(`/sign-up?error=${message(error.message)}`);
  if (!data.session) {
    redirect(`/sign-in?message=${message("Check your email to confirm your account, then sign in.")}`);
  }

  revalidatePath("/", "layout");
  redirect("/pending");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!validEmail(email)) {
    redirect(`/forgot-password?error=${message("Enter a valid email address.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/callback?next=/update-password`,
  });
  if (error) redirect(`/forgot-password?error=${message(error.message)}`);

  redirect(`/forgot-password?message=${message("If an account exists, a reset link has been sent.")}`);
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  if (password.length < 8 || password !== confirmPassword) {
    redirect(`/update-password?error=${message("Passwords must match and contain at least 8 characters.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/update-password?error=${message(error.message)}`);

  redirect(`/app?message=${message("Your password has been updated.")}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/sign-in");
}
