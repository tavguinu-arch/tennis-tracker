-- Add account profiles and per-player ownership without replacing the six
-- official relational tables. Existing rows remain unassigned until the
-- one-time script in supabase/setup/ is run for the designated test account.

begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale text not null default 'en-GB',
  currency_code text not null default 'EUR',
  timezone text not null default 'Europe/Lisbon',
  preferred_tension_unit text not null default 'kg'
    check (preferred_tension_unit in ('kg', 'lb')),
  theme text not null default 'system'
    check (theme in ('system', 'light', 'dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;

-- Create profiles for existing Auth users as well as new registrations.
insert into public.profiles (id, display_name)
select
  users.id,
  nullif(coalesce(
    users.raw_user_meta_data ->> 'full_name',
    users.raw_user_meta_data ->> 'name',
    split_part(coalesce(users.email, ''), '@', 1)
  ), '')
from auth.users as users
on conflict (id) do nothing;

create or replace function public.create_tennis_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_tennis_profile_for_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_tennis_profile on auth.users;
create trigger on_auth_user_created_tennis_profile
  after insert on auth.users
  for each row execute function public.create_tennis_profile_for_auth_user();

create or replace function public.set_tennis_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_tennis_profile_updated_at on public.profiles;
create trigger set_tennis_profile_updated_at
  before update on public.profiles
  for each row execute function public.set_tennis_profile_updated_at();

-- Scope every official tennis record to the Auth account that owns the player.
alter table public.racket_models
  add column if not exists user_id uuid default auth.uid()
  references auth.users (id) on delete cascade;
alter table public.rackets
  add column if not exists user_id uuid default auth.uid()
  references auth.users (id) on delete cascade;
alter table public.strings
  add column if not exists user_id uuid default auth.uid()
  references auth.users (id) on delete cascade;
alter table public.string_reels
  add column if not exists user_id uuid default auth.uid()
  references auth.users (id) on delete cascade;
alter table public.stringers
  add column if not exists user_id uuid default auth.uid()
  references auth.users (id) on delete cascade;
alter table public.stringings
  add column if not exists user_id uuid default auth.uid()
  references auth.users (id) on delete cascade;

-- Composite keys make it impossible to connect one player's row to another
-- player's racket model, string, reel, racket, or stringer.
create unique index if not exists racket_models_user_id_id_key
  on public.racket_models (user_id, id);
create unique index if not exists rackets_user_id_id_key
  on public.rackets (user_id, id);
create unique index if not exists strings_user_id_id_key
  on public.strings (user_id, id);
create unique index if not exists string_reels_user_id_id_key
  on public.string_reels (user_id, id);
create unique index if not exists stringers_user_id_id_key
  on public.stringers (user_id, id);

grant select, insert, update, delete on
  public.racket_models,
  public.rackets,
  public.strings,
  public.string_reels,
  public.stringers,
  public.stringings
to authenticated;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'rackets_same_owner_model_fk' and conrelid = 'public.rackets'::regclass) then
    alter table public.rackets add constraint rackets_same_owner_model_fk
      foreign key (user_id, model_id) references public.racket_models (user_id, id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'string_reels_same_owner_string_fk' and conrelid = 'public.string_reels'::regclass) then
    alter table public.string_reels add constraint string_reels_same_owner_string_fk
      foreign key (user_id, string_id) references public.strings (user_id, id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'stringings_same_owner_racket_fk' and conrelid = 'public.stringings'::regclass) then
    alter table public.stringings add constraint stringings_same_owner_racket_fk
      foreign key (user_id, racket_id) references public.rackets (user_id, id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'stringings_same_owner_main_reel_fk' and conrelid = 'public.stringings'::regclass) then
    alter table public.stringings add constraint stringings_same_owner_main_reel_fk
      foreign key (user_id, main_reel_id) references public.string_reels (user_id, id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'stringings_same_owner_cross_reel_fk' and conrelid = 'public.stringings'::regclass) then
    alter table public.stringings add constraint stringings_same_owner_cross_reel_fk
      foreign key (user_id, cross_reel_id) references public.string_reels (user_id, id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'stringings_same_owner_stringer_fk' and conrelid = 'public.stringings'::regclass) then
    alter table public.stringings add constraint stringings_same_owner_stringer_fk
      foreign key (user_id, stringer_id) references public.stringers (user_id, id) not valid;
  end if;
end;
$$;

-- The restrictive guard also narrows any older permissive policies. This lets
-- us add account ownership without silently retaining a broad public policy.
do $$
declare
  table_name text;
  owner_guard_name text;
  owner_access_name text;
begin
  foreach table_name in array array[
    'racket_models', 'rackets', 'strings', 'string_reels', 'stringers', 'stringings'
  ] loop
    owner_guard_name := table_name || '_owner_guard';
    owner_access_name := table_name || '_owner_access';

    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', owner_guard_name, table_name);
    execute format(
      'create policy %I on public.%I as restrictive for all to public using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      owner_guard_name, table_name
    );
    execute format('drop policy if exists %I on public.%I', owner_access_name, table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      owner_access_name, table_name
    );
  end loop;
end;
$$;

alter table public.profiles enable row level security;
drop policy if exists profiles_owner_guard on public.profiles;
create policy profiles_owner_guard on public.profiles
  as restrictive for all to public
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
drop policy if exists profiles_owner_access on public.profiles;
drop policy if exists profiles_owner_select on public.profiles;
create policy profiles_owner_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));
drop policy if exists profiles_owner_insert on public.profiles;
create policy profiles_owner_insert on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));
drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

commit;
