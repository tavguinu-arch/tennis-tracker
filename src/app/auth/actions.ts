"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeError(message: string) {
  return encodeURIComponent(message.slice(0, 180));
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

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
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
