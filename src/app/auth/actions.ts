"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeError(message: string) {
  return encodeURIComponent(message.slice(0, 180));
}

function appOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return new URL(configured).origin;
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=configuration");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${safeError("Email or password is incorrect.")}`);

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/signup?error=configuration");

  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) redirect("/signup?error=Use a password with at least 8 characters.");

  const origin = appOrigin();
  const emailRedirectTo = new URL("/auth/callback?next=/", origin).toString();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: { full_name: displayName },
    },
  });

  if (error) redirect(`/signup?error=${safeError(error.message)}`);
  if (!data.session) redirect("/login?message=Check your email to confirm your account, then sign in.");

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=configuration");
  const email = String(formData.get("email") ?? "").trim();
  if (!email || email.length > 254) redirect("/forgot-password?sent=1");
  const origin = appOrigin();
  const redirectTo = new URL("/auth/callback?next=/reset-password", origin).toString();
  // Use the same response regardless of whether Supabase found the address.
  await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  redirect("/forgot-password?sent=1");
}

export async function updateRecoveryPassword(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=configuration");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?message=Open the password reset link from your email first.");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 8 || password !== confirmation) redirect("/reset-password?error=invalid");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/reset-password?error=failed");
  revalidatePath("/", "layout");
  redirect("/reset-password?updated=1");
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=configuration");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");
  const currentPassword = String(formData.get("current_password") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 8 || password !== confirmation || password === currentPassword) redirect("/?accountError=password-invalid");
  const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (reauthError) redirect("/?accountError=password-current");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/?accountError=password-update");
  revalidatePath("/");
  redirect("/?accountMessage=password-updated");
}

export async function deleteAccount(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=configuration");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");
  const currentPassword = String(formData.get("current_password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (confirmation !== "DELETE" || !currentPassword) redirect("/?accountError=delete-confirmation");
  const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (reauthError) redirect("/?accountError=delete-password");
  const { error } = await supabase.rpc("delete_my_tennis_account");
  if (error) redirect("/?accountError=delete-failed");
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?message=account-deleted");
}

export async function saveProfileSettings(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=configuration");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const locale = String(formData.get("locale") ?? "en-GB");
  const currencyCode = String(formData.get("currency_code") ?? "EUR");
  const timezone = String(formData.get("timezone") ?? "Europe/Lisbon");
  const tensionUnit = String(formData.get("preferred_tension_unit") ?? "kg");
  const theme = String(formData.get("theme") ?? "system");

  if (
    !displayName || displayName.length > 80 ||
    !["en-GB", "pt-PT"].includes(locale) ||
    !["EUR", "GBP", "USD"].includes(currencyCode) ||
    !["Europe/Lisbon", "Europe/London", "Europe/Paris", "UTC"].includes(timezone) ||
    !["kg", "lb"].includes(tensionUnit) ||
    !["system", "light", "dark"].includes(theme)
  ) {
    redirect("/?profileError=invalid-settings");
  }

  const { error } = await supabase.from("profiles").update({
    display_name: displayName,
    locale,
    currency_code: currencyCode,
    timezone,
    preferred_tension_unit: tensionUnit,
    theme,
  }).eq("id", user.id);

  if (error) redirect("/?profileError=settings-not-saved");
  revalidatePath("/");
  redirect("/?profileSaved=1");
}
