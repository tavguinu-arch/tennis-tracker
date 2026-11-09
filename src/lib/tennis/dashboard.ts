import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type RacketSummary = {
  id: number;
  modelId: number | null;
  purchaseDate: string | null;
  priceValue: number | null;
  isActive: boolean | null;
  notes: string | null;
  name: string;
  model: string;
  bought: string;
  price: string;
};

export type StringingSummary = {
  id: number;
  racketId: number | null;
  mainReelId: number | null;
  crossReelId: number | null;
  stringerId: number | null;
  stringingDate: string | null;
  mainTension: number;
  crossTension: number;
  mainUnit: string | null;
  crossUnit: string | null;
  serviceCost: number | null;
  hoursPlayed: number | null;
  replacementReason: string | null;
  notes: string | null;
  date: string;
  racket: string;
  string: string;
  tension: string;
  stringer: string;
};

export type ReelSummary = {
  id: number;
  stringId: number | null;
  purchaseDate: string | null;
  priceValue: number | null;
  totalStringingsValue: number | null;
  notes: string | null;
  name: string;
  bought: string;
  price: string;
  usedCapacity: number;
  remainingCapacity: number | null;
};

export type StringSummary = {
  id: number;
  brand: string;
  name: string;
  type: string | null;
  gauge: string | null;
};

export type DashboardSnapshot = {
  activeRackets: number;
  stringingsCount: number;
  racketSpend: number;
  stringSpend: number;
  serviceSpend: number;
  rackets: RacketSummary[];
  stringings: StringingSummary[];
  reels: ReelSummary[];
  strings: StringSummary[];
  racketModels: { id: number; brand: string; name: string; headSize: number | null; weightGrams: number | null; stringPattern: string | null; notes: string | null }[];
  stringers: { id: number; name: string; notes: string | null }[];
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function currencyFormatter(currencyCode: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: currencyCode });
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return dateFormatter.format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

function formatString(brand: string | null, name: string | null, gauge: string | null) {
  return [brand, name, gauge].filter(Boolean).join(" ") || "Unknown string";
}

export async function getDashboardSnapshot(
  supabase: SupabaseClient<Database>,
  currencyCode = "EUR",
): Promise<DashboardSnapshot> {
  const currency = currencyFormatter(currencyCode);
  const [modelsResult, racketsResult, stringsResult, reelsResult, stringingsResult, stringersResult] =
    await Promise.all([
      supabase.from("racket_models").select("id, brand, model_name, head_size, weight_grams, string_pattern, notes").order("brand"),
      supabase.from("rackets").select("id, identifier, model_id, purchase_date, price, is_active, notes").order("id"),
      supabase.from("strings").select("id, brand, name, type, gauge").order("brand"),
      supabase.from("string_reels").select("id, string_id, purchase_date, price, total_stringings, notes").order("purchase_date", { ascending: false }),
      supabase.from("stringings").select("id, racket_id, main_reel_id, cross_reel_id, stringer_id, stringing_date, main_tension_kg, cross_tension_kg, main_tension_unit, cross_tension_unit, service_cost, hours_played, replacement_reason, notes").order("stringing_date", { ascending: false }),
      supabase.from("stringers").select("id, name, notes"),
    ]);

  if (
    modelsResult.error || racketsResult.error || stringsResult.error ||
    reelsResult.error || stringingsResult.error || stringersResult.error
  ) {
    throw new Error("Could not load player data under the current account policies.");
  }

  const models = new Map(modelsResult.data.map((item) => [item.id, item]));
  const racketsById = new Map(racketsResult.data.map((item) => [item.id, item]));
  const stringsById = new Map(stringsResult.data.map((item) => [item.id, item]));
  const reelsById = new Map(reelsResult.data.map((item) => [item.id, item]));
  const stringersById = new Map(stringersResult.data.map((item) => [item.id, item]));

  const rackets = racketsResult.data.map((racket) => {
    const model = racket.model_id === null ? undefined : models.get(racket.model_id);
    return {
      id: racket.id,
      modelId: racket.model_id,
      purchaseDate: racket.purchase_date,
      priceValue: racket.price,
      isActive: racket.is_active,
      notes: racket.notes,
      name: racket.identifier,
      model: [model?.brand, model?.model_name].filter(Boolean).join(" ") || "Model not set",
      bought: formatDate(racket.purchase_date),
      price: racket.price === null ? "—" : currency.format(racket.price),
    };
  });

  const stringings = stringingsResult.data.slice(0, 15).map((session) => {
    const racket = session.racket_id === null ? undefined : racketsById.get(session.racket_id);
    const mainReel = session.main_reel_id === null ? undefined : reelsById.get(session.main_reel_id);
    const crossReel = session.cross_reel_id === null ? undefined : reelsById.get(session.cross_reel_id);
    const mainString = mainReel?.string_id === null || !mainReel ? undefined : stringsById.get(mainReel.string_id);
    const crossString = crossReel?.string_id === null || !crossReel ? undefined : stringsById.get(crossReel.string_id);
    const mainLabel = formatString(mainString?.brand ?? null, mainString?.name ?? null, mainString?.gauge ?? null);
    const crossLabel = formatString(crossString?.brand ?? null, crossString?.name ?? null, crossString?.gauge ?? null);
    const stringer = session.stringer_id === null ? undefined : stringersById.get(session.stringer_id);
    const mainUnit = session.main_tension_unit ?? "kg";
    const crossUnit = session.cross_tension_unit ?? "kg";

    return {
      id: session.id,
      racketId: session.racket_id,
      mainReelId: session.main_reel_id,
      crossReelId: session.cross_reel_id,
      stringerId: session.stringer_id,
      stringingDate: session.stringing_date,
      mainTension: session.main_tension_kg,
      crossTension: session.cross_tension_kg,
      mainUnit: session.main_tension_unit,
      crossUnit: session.cross_tension_unit,
      serviceCost: session.service_cost,
      hoursPlayed: session.hours_played,
      replacementReason: session.replacement_reason,
      notes: session.notes,
      date: formatDate(session.stringing_date),
      racket: racket?.identifier ?? "—",
      string: mainLabel === crossLabel ? mainLabel : `${mainLabel} / ${crossLabel}`,
      tension: `${session.main_tension_kg} ${mainUnit} / ${session.cross_tension_kg} ${crossUnit}`,
      stringer: stringer?.name ?? "—",
    };
  });

  const reels = reelsResult.data.map((reel) => {
    const string = reel.string_id === null ? undefined : stringsById.get(reel.string_id);
    // Each stringing consumes half a full-bed equivalent from each reel used.
    // Using the same reel for mains and crosses therefore consumes one whole equivalent.
    const usedCapacity = stringingsResult.data.reduce((total, session) =>
      total + (session.main_reel_id === reel.id ? 0.5 : 0) + (session.cross_reel_id === reel.id ? 0.5 : 0), 0);
    return {
      id: reel.id,
      stringId: reel.string_id,
      purchaseDate: reel.purchase_date,
      priceValue: reel.price,
      totalStringingsValue: reel.total_stringings,
      notes: reel.notes,
      name: formatString(string?.brand ?? null, string?.name ?? null, string?.gauge ?? null),
      bought: formatDate(reel.purchase_date),
      price: reel.price === null ? "—" : currency.format(reel.price),
      usedCapacity,
      remainingCapacity: reel.total_stringings === null ? null : reel.total_stringings - usedCapacity,
    };
  });

  const strings = stringsResult.data.map((item) => ({
    id: item.id,
    brand: item.brand,
    name: item.name,
    type: item.type,
    gauge: item.gauge,
  }));

  return {
    activeRackets: racketsResult.data.filter((racket) => racket.is_active === true).length,
    stringingsCount: stringingsResult.data.length,
    racketSpend: racketsResult.data.reduce((sum, racket) => sum + (racket.price ?? 0), 0),
    stringSpend: reelsResult.data.reduce((sum, reel) => sum + (reel.price ?? 0), 0),
    serviceSpend: stringingsResult.data.reduce((sum, session) => sum + (session.service_cost ?? 0), 0),
    rackets,
    stringings,
    reels,
    strings,
    racketModels: modelsResult.data.map((model) => ({
      id: model.id,
      brand: model.brand ?? "Unknown brand",
      name: model.model_name ?? "Unnamed model",
      headSize: model.head_size,
      weightGrams: model.weight_grams,
      stringPattern: model.string_pattern,
      notes: model.notes,
    })),
    stringers: stringersResult.data.map((stringer) => ({ id: stringer.id, name: stringer.name, notes: stringer.notes })),
  };
}

export function formatCurrency(value: number, currencyCode = "EUR") {
  return currencyFormatter(currencyCode).format(value);
}
