export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // The production Vercel project still has the older Supabase anon-key
  // variable. It is a public client key guarded by RLS; retain compatibility
  // while using the current publishable-key name for this workspace.
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) return null;

  return { url, publishableKey };
}
