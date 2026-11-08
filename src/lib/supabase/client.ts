"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "./env";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  const config = getSupabaseConfig();
  if (!config) return null;

  browserClient ??= createBrowserClient<Database>(config.url, config.publishableKey);
  return browserClient;
}
