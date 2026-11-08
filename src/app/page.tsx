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
};

export default async function HomePage({ searchParams }: { searchParams: Promise<{ profileSaved?: string; profileError?: string }> }) {
  const supabase = await createClient();
  if (!supabase) return <DashboardClient data={null} profileName="Test player" />;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, locale, currency_code, timezone, preferred_tension_unit, theme")
    .eq("id", user.id)
    .maybeSingle();

  let data = emptySnapshot;
  let loadError: string | null = null;
  try {
    data = await getDashboardSnapshot(supabase, profile?.currency_code ?? "EUR");
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
      locale: profile?.locale ?? "en-GB",
      currency_code: profile?.currency_code ?? "EUR",
      timezone: profile?.timezone ?? "Europe/Lisbon",
      preferred_tension_unit: profile?.preferred_tension_unit ?? "kg",
      theme: profile?.theme ?? "system",
    }}
    saved={params.profileSaved === "1"}
    profileError={params.profileError ?? null}
    loadError={loadError}
  />;
}
