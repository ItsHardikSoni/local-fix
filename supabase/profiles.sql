-- Run in the Supabase SQL editor. Passwords are hashed by Supabase Auth (bcrypt);
-- never store plaintext passwords in public tables.

create or replace function public.create_profile_for_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists profiles_create_auth_user on auth.users;

create trigger profiles_create_auth_user
after insert on auth.users
for each row
execute function public.create_profile_for_new_auth_user();

insert into public.profiles (id, full_name, phone, email)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'full_name', ''),
  nullif(users.raw_user_meta_data ->> 'phone', ''),
  users.email
from auth.users as users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

revoke all on table public.profiles from anon, public;
grant select, insert, update on table public.profiles to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (
  (select auth.uid()) = id
  and account_status = 'active'
);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check (
  (select auth.uid()) = id
  and account_status = 'active'
);
