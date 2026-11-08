# Tennis Tracker

Next.js foundation for rebuilding the existing Glide app from its four current screens: Overview, Rackets, Stringings, and Strings.

## Current prototype

- Responsive desktop and mobile navigation modeled on the supplied Glide screenshots.
- The Overview, Rackets, Stringings, and Strings screens follow the supplied Glide screenshots.
- Sign-up, sign-in, email confirmation, sign-out, and profile preference updates use Supabase Auth and RLS.
- With Supabase configured, the dashboard reads the signed-in player's records; without configuration, it shows screenshot-based preview values.
- `src/types/database.ts` reflects the six official tables, the new `profiles` table, ownership columns, and their current relationships in Supabase.

## Local environment

Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Only use the publishable key in browser-visible configuration. Never expose a `service_role` or secret key under a `NEXT_PUBLIC_*` name. Keep RLS enabled and scope policies to the authenticated user before adding writes.

Keep `.env.local` out of Git. Supabase Auth allows the local callback at `http://localhost:3000/auth/callback` and the production callback at `https://tennis-tracker-iota-seven.vercel.app/auth/callback`. The production Site URL is set to the Vercel domain. Start local development with `pnpm install` and `pnpm dev` in an environment with Node.js available.

## Data model and next integration step

The relational schema is retained. A stringing refers to its racket, main reel, cross reel, and optionally its stringer. Inventory and cost calculations must use those separate relations. The preview values are a visual reference, not seeded database records.

The old `raquetas` and `rolos` tables were removed from Supabase after confirmation; they are not part of this app. The migration `supabase/migrations/20261108_profiles_and_user_ownership.sql` was applied to the live Supabase project on 2026-11-08. It creates a profile per Auth account, adds `user_id` ownership to the six official tables, enables owner-scoped RLS, and adds same-owner composite foreign keys. The test Auth account has been created and the 22 existing records across the six tables have been assigned to it. The setup script `supabase/setup/assign_existing_records_to_test_player.sql` also makes `user_id` required and validates the composite relationships.

The ownership migration restricts the old anonymous Glide connection. The dedicated test player is now registered and assigned to the existing data. New future modules (training, mental training, tournaments/results) can use their own relational tables linked to the profile; they do not need to be added to the current six tables.

The Vercel project already has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured for Production and Preview. The environment helper also accepts the newer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` name for local development. The login and signup flow uses Supabase Auth, the dashboard requires a signed-in player, and its read-only queries use the player's RLS scope. Before adopting Supabase CLI migrations, reconcile the migration history because the ownership SQL was applied through the dashboard. Reel-consumption and cost calculations still need comparison against Glide behavior before any write forms are added.
