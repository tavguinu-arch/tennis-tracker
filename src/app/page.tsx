import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import { createClient } from "@/lib/supabase/server";
import { getDashboardSnapshot, type DashboardSnapshot } from "@/lib/tennis/dashboard";

const emptySnapshot: DashboardSnapshot = {
  activeRackets: 0,
  stringingsCount: 0,
  racketSpend: 0,
  stringSpend: 0,
  serviceSpend: 0,
  rackets: [],
  stringings: [],
  reels: [],
  strings: [],
  racketModels: [],
  stringers: [],
};

function preference<T extends string>(value: string | null | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? value as T : fallback;
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ profileSaved?: string; profileError?: string; accountMessage?: string; accountError?: string }> }) {
  const supabase = await createClient();
  if (!supabase) return <DashboardClient data={null} profileName="Test player" />;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, locale, currency_code, timezone, preferred_tension_unit, theme")
    .eq("id", user.id)
    .maybeSingle();

  const locale = preference(profile?.locale, ["en-GB", "pt-PT"], "en-GB");
  const currencyCode = preference(profile?.currency_code, ["EUR", "GBP", "USD"], "EUR");
  const timezone = preference(profile?.timezone, ["Europe/Lisbon", "Europe/London", "Europe/Paris", "UTC"], "Europe/Lisbon");
  const preferredTensionUnit = preference(profile?.preferred_tension_unit, ["kg", "lb"], "kg");
  const theme = preference(profile?.theme, ["system", "light", "dark"], "system");
  let data = emptySnapshot;
  let loadError: string | null = null;
  try {
    data = await getDashboardSnapshot(supabase, currencyCode, locale, timezone);
  } catch {
    loadError = "We could not load your records. Please refresh or sign in again.";
  }

  const profileName = profile?.display_name ?? user.email?.split("@")[0] ?? "Player";
  const params = await searchParams;
  return <DashboardClient
    data={data}
    profileName={profileName}
    email={user.email ?? ""}
    preferences={{
      locale,
      currency_code: currencyCode,
      timezone,
      preferred_tension_unit: preferredTensionUnit,
      theme,
    }}
    saved={params.profileSaved === "1"}
    profileError={params.profileError ?? null}
    loadError={loadError}
    accountMessage={params.accountMessage ?? null}
    accountError={params.accountError ?? null}
    accountDeletionEnabled={process.env.ACCOUNT_DELETION_ENABLED === "true"}
  />;
}
