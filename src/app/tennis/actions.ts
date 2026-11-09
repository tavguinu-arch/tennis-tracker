"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RecordActionState = { error?: string; success?: string };

function text(formData: FormData, key: string, maxLength = 500) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length <= maxLength ? value : "";
}

function optionalNumber(formData: FormData, key: string) {
  const value = text(formData, key, 40);
  if (!value) return { valid: true as const, value: null };
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0
    ? { valid: true as const, value: parsed }
    : { valid: false as const, value: null };
}

function requiredNumber(formData: FormData, key: string, min = 0) {
  const value = text(formData, key, 40);
  const parsed = Number(value);
  return value && Number.isFinite(parsed) && parsed >= min
    ? { valid: true as const, value: parsed }
    : { valid: false as const, value: null };
}

function optionalId(formData: FormData, key: string) {
  const value = text(formData, key, 30);
  if (!value) return { valid: true as const, value: null };
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? { valid: true as const, value: parsed }
    : { valid: false as const, value: null };
}

function optionalDate(formData: FormData, key: string) {
  const value = text(formData, key, 10);
  if (!value) return { valid: true as const, value: null };
  const date = new Date(`${value}T00:00:00.000Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
    ? { valid: true as const, value }
    : { valid: false as const, value: null };
}

export async function createTennisRecord(
  _previousState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is not configured for this environment." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again before saving." };

  const kind = text(formData, "kind", 30);
  const recordId = optionalId(formData, "record_id");
  if (!recordId.valid) return { error: "This record could not be identified. Refresh the page and try again." };
  const notes = text(formData, "notes", 1000) || null;
  let error: { message: string } | null = null;

  switch (kind) {
    case "model": {
      const brand = text(formData, "brand", 100);
      const modelName = text(formData, "model_name", 120);
      const headSize = optionalNumber(formData, "head_size");
      const weight = optionalNumber(formData, "weight_grams");
      if (!brand || !modelName || !headSize.valid || !weight.valid) return { error: "Enter a brand and model name, and check the optional numeric fields." };
      const values = {
        user_id: user.id,
        brand,
        model_name: modelName,
        head_size: headSize.value,
        weight_grams: weight.value,
        string_pattern: text(formData, "string_pattern", 30) || null,
        notes,
      };
      const result = recordId.value
        ? await supabase.from("racket_models").update(values).eq("id", recordId.value).eq("user_id", user.id).select("id")
        : await supabase.from("racket_models").insert(values);
      error = result.error;
      if (!error && recordId.value && result.data?.length === 0) return { error: "This model was not found in your account." };
      break;
    }
    case "racket": {
      const identifier = text(formData, "identifier", 80);
      const modelId = optionalId(formData, "model_id");
      const purchaseDate = optionalDate(formData, "purchase_date");
      const price = optionalNumber(formData, "price");
      if (!identifier || !modelId.valid || !purchaseDate.valid || !price.valid) return { error: "Check the racket name, date and price." };
      const values = {
        user_id: user.id,
        identifier,
        model_id: modelId.value,
        purchase_date: purchaseDate.value,
        price: price.value,
        is_active: formData.get("is_active") === "on",
        notes,
      };
      const result = recordId.value
        ? await supabase.from("rackets").update(values).eq("id", recordId.value).eq("user_id", user.id).select("id")
        : await supabase.from("rackets").insert(values);
      error = result.error;
      if (!error && recordId.value && result.data?.length === 0) return { error: "This racket was not found in your account." };
      break;
    }
    case "stringer": {
      const name = text(formData, "name", 120);
      if (!name) return { error: "Enter the stringer’s name." };
      const values = { user_id: user.id, name, notes };
      const result = recordId.value
        ? await supabase.from("stringers").update(values).eq("id", recordId.value).eq("user_id", user.id).select("id")
        : await supabase.from("stringers").insert(values);
      error = result.error;
      if (!error && recordId.value && result.data?.length === 0) return { error: "This stringer was not found in your account." };
      break;
    }
    case "string": {
      const brand = text(formData, "brand", 100);
      const name = text(formData, "name", 120);
      if (!brand || !name) return { error: "Enter the string brand and name." };
      const values = {
        user_id: user.id,
        brand,
        name,
        type: text(formData, "type", 80) || null,
        gauge: text(formData, "gauge", 30) || null,
      };
      const result = recordId.value
        ? await supabase.from("strings").update(values).eq("id", recordId.value).eq("user_id", user.id).select("id")
        : await supabase.from("strings").insert(values);
      error = result.error;
      if (!error && recordId.value && result.data?.length === 0) return { error: "This string was not found in your account." };
      break;
    }
    case "reel": {
      const stringId = optionalId(formData, "string_id");
      const purchaseDate = optionalDate(formData, "purchase_date");
      const price = optionalNumber(formData, "price");
      const capacity = requiredNumber(formData, "total_stringings", 1);
      if (!stringId.valid || !purchaseDate.valid || !price.valid || !capacity.valid || !Number.isInteger(capacity.value)) return { error: "Select a string and check the purchase date, price and reel capacity." };
      const values = {
        user_id: user.id,
        string_id: stringId.value,
        purchase_date: purchaseDate.value,
        price: price.value,
        total_stringings: capacity.value,
        notes,
      };
      const result = recordId.value
        ? await supabase.from("string_reels").update(values).eq("id", recordId.value).eq("user_id", user.id).select("id")
        : await supabase.from("string_reels").insert(values);
      error = result.error;
      if (!error && recordId.value && result.data?.length === 0) return { error: "This reel was not found in your account." };
      break;
    }
    case "stringing": {
      const racketId = optionalId(formData, "racket_id");
      const mainReelId = optionalId(formData, "main_reel_id");
      const crossReelId = optionalId(formData, "cross_reel_id");
      const stringerId = optionalId(formData, "stringer_id");
      const mainTension = requiredNumber(formData, "main_tension_kg", 1);
      const crossTension = requiredNumber(formData, "cross_tension_kg", 1);
      const serviceCost = optionalNumber(formData, "service_cost");
      const hoursPlayed = optionalNumber(formData, "hours_played");
      const stringingDate = optionalDate(formData, "stringing_date");
      if (!racketId.valid || !racketId.value || !mainReelId.valid || !mainReelId.value || !crossReelId.valid || !crossReelId.value || !stringerId.valid || !mainTension.valid || !crossTension.valid || !serviceCost.valid || !hoursPlayed.valid || !stringingDate.valid) {
        return { error: "Choose a racket and both reels, then check the stringing details." };
      }
      const mainUnit = text(formData, "main_tension_unit", 4);
      const crossUnit = text(formData, "cross_tension_unit", 4);
      if (!["kg", "lb"].includes(mainUnit) || !["kg", "lb"].includes(crossUnit)) return { error: "Choose kg or lb for both tensions." };
      const values = {
        user_id: user.id,
        racket_id: racketId.value,
        main_reel_id: mainReelId.value,
        cross_reel_id: crossReelId.value,
        stringer_id: stringerId.value,
        main_tension_kg: mainTension.value!,
        cross_tension_kg: crossTension.value!,
        main_tension_unit: mainUnit,
        cross_tension_unit: crossUnit,
        service_cost: serviceCost.value,
        hours_played: hoursPlayed.value,
        stringing_date: stringingDate.value,
        replacement_reason: text(formData, "replacement_reason", 120) || null,
        notes,
      };
      const result = recordId.value
        ? await supabase.from("stringings").update(values).eq("id", recordId.value).eq("user_id", user.id).select("id")
        : await supabase.from("stringings").insert(values);
      error = result.error;
      if (!error && recordId.value && result.data?.length === 0) return { error: "This stringing was not found in your account." };
      break;
    }
    default:
      return { error: "Choose a valid record type." };
  }

  if (error) return { error: "The record could not be saved. Check the selected values and try again." };
  revalidatePath("/");
  return { success: "Saved successfully." };
}
