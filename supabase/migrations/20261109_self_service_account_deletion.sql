-- Let an authenticated player delete only their own account.
-- The existing owner foreign keys cascade the profile and tennis records.
begin;

create or replace function public.delete_my_tennis_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := (select auth.uid());
begin
  if account_id is null then
    raise exception 'Authentication is required';
  end if;

  -- The app re-checks the current password before calling this RPC. Requiring
  -- a recent authentication claim prevents an old access token from deleting
  -- an account directly through the Data API.
  if not exists (
    select 1
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as methods(amr)
    where amr ->> 'method' in ('password', 'otp', 'totp', 'oauth', 'magiclink')
      and nullif(amr ->> 'timestamp', '')::bigint >= extract(epoch from now())::bigint - 300
  ) then
    raise exception 'Recent authentication is required';
  end if;

  delete from auth.users where id = account_id;
  if not found then
    raise exception 'Account not found';
  end if;
end;
$$;

revoke all on function public.delete_my_tennis_account() from public, anon;
grant execute on function public.delete_my_tennis_account() to authenticated;

commit;
