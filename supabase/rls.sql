-- Apply after the related tables exist. Policies are skipped when a table is missing.
-- Rate limits, CORS allowlists, and leaked-password protection are configured in
-- the Supabase dashboard (Authentication and API settings), not in this client app.

do $$
begin
  if to_regclass('public.customer_addresses') is not null then
    execute 'alter table public.customer_addresses enable row level security';
    execute 'alter table public.customer_addresses force row level security';
    execute 'revoke all on table public.customer_addresses from anon, public';
    execute 'grant select, insert, update on table public.customer_addresses to authenticated';

    execute 'drop policy if exists customer_addresses_select_own on public.customer_addresses';
    execute $policy$
      create policy customer_addresses_select_own
      on public.customer_addresses
      for select
      to authenticated
      using ((select auth.uid()) = customer_id)
    $policy$;

    execute 'drop policy if exists customer_addresses_insert_own on public.customer_addresses';
    execute $policy$
      create policy customer_addresses_insert_own
      on public.customer_addresses
      for insert
      to authenticated
      with check ((select auth.uid()) = customer_id)
    $policy$;

    execute 'drop policy if exists customer_addresses_update_own on public.customer_addresses';
    execute $policy$
      create policy customer_addresses_update_own
      on public.customer_addresses
      for update
      to authenticated
      using ((select auth.uid()) = customer_id)
      with check ((select auth.uid()) = customer_id)
    $policy$;
  end if;

  if to_regclass('public.districts') is not null then
    execute 'alter table public.districts enable row level security';
    execute 'alter table public.districts force row level security';
    execute 'revoke all on table public.districts from anon, public';
    execute 'grant select on table public.districts to authenticated';
    execute 'drop policy if exists districts_select_active on public.districts';
    execute $policy$
      create policy districts_select_active
      on public.districts
      for select
      to authenticated
      using (is_active)
    $policy$;
  end if;

  if to_regclass('public.service_categories') is not null then
    execute 'alter table public.service_categories enable row level security';
    execute 'alter table public.service_categories force row level security';
    execute 'revoke all on table public.service_categories from anon, public';
    execute 'grant select on table public.service_categories to authenticated';
    execute 'drop policy if exists service_categories_select_active on public.service_categories';
    execute $policy$
      create policy service_categories_select_active
      on public.service_categories
      for select
      to authenticated
      using (is_active)
    $policy$;
  end if;

  if to_regclass('public.worker_profiles') is not null then
    execute 'alter table public.worker_profiles enable row level security';
    execute 'alter table public.worker_profiles force row level security';
    execute 'revoke all on table public.worker_profiles from anon, public';
    execute 'grant select on table public.worker_profiles to authenticated';
    execute 'drop policy if exists worker_profiles_select_verified_or_self on public.worker_profiles';
    execute $policy$
      create policy worker_profiles_select_verified_or_self
      on public.worker_profiles
      for select
      to authenticated
      using (verification_status = 'verified' or (select auth.uid()) = id)
    $policy$;
  end if;

  if to_regclass('public.worker_service_categories') is not null then
    execute 'alter table public.worker_service_categories enable row level security';
    execute 'alter table public.worker_service_categories force row level security';
    execute 'revoke all on table public.worker_service_categories from anon, public';
    execute 'grant select on table public.worker_service_categories to authenticated';
    execute 'drop policy if exists worker_service_categories_select_authenticated on public.worker_service_categories';
    execute $policy$
      create policy worker_service_categories_select_authenticated
      on public.worker_service_categories
      for select
      to authenticated
      using (true)
    $policy$;
  end if;
end $$;
