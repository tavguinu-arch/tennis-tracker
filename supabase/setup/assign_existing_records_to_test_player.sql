-- Run once, after the dedicated test player has registered in Supabase Auth.
-- Replace the email below with that exact account before executing.
-- This assigns the six official relational tables to that one player, then
-- locks ownership columns and validates cross-table owner relationships.

begin;

do $$
declare
  test_player_id uuid;
  test_player_email constant text := 'REPLACE_WITH_TEST_PLAYER_EMAIL';
begin
  select id
    into test_player_id
    from auth.users
   where lower(email) = lower(test_player_email);

  if test_player_id is null then
    raise exception 'No Auth user found for %. Register the test player first.', test_player_email;
  end if;

  update public.racket_models set user_id = test_player_id where user_id is null;
  update public.rackets set user_id = test_player_id where user_id is null;
  update public.strings set user_id = test_player_id where user_id is null;
  update public.string_reels set user_id = test_player_id where user_id is null;
  update public.stringers set user_id = test_player_id where user_id is null;
  update public.stringings set user_id = test_player_id where user_id is null;

  alter table public.racket_models alter column user_id set not null;
  alter table public.rackets alter column user_id set not null;
  alter table public.strings alter column user_id set not null;
  alter table public.string_reels alter column user_id set not null;
  alter table public.stringers alter column user_id set not null;
  alter table public.stringings alter column user_id set not null;

  alter table public.rackets validate constraint rackets_same_owner_model_fk;
  alter table public.string_reels validate constraint string_reels_same_owner_string_fk;
  alter table public.stringings validate constraint stringings_same_owner_racket_fk;
  alter table public.stringings validate constraint stringings_same_owner_main_reel_fk;
  alter table public.stringings validate constraint stringings_same_owner_cross_reel_fk;
  alter table public.stringings validate constraint stringings_same_owner_stringer_fk;
end;
$$;

commit;
