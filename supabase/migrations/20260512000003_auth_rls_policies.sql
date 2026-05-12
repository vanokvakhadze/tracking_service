-- Migration: RLS policies for the Supabase Auth flow
--
-- The reference schema either did not enable RLS on key tables (users,
-- tenants) or relied on `current_setting('app.current_tenant')` policies
-- meant for a non-Supabase-Auth deployment. Supabase nonetheless enables RLS
-- by default on every public-schema table, so without explicit policies the
-- authenticated role gets zero rows back with no error.
--
-- This migration adds the minimum auth.uid()-aware SELECT policies needed by
-- /dashboard, /users, and the invitation flow:
--   * users: read & update own profile
--   * tenant_memberships: read own memberships
--   * tenants: read tenants you actively belong to

-- USERS -----------------------------------------------------------------------
alter table public.users enable row level security;

drop policy if exists users_read_self on public.users;
create policy users_read_self on public.users
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- TENANT_MEMBERSHIPS ----------------------------------------------------------
-- RLS already enabled in the base schema (with a legacy session-variable
-- policy that never matches under Supabase Auth — leave it alone, just add
-- our auth.uid()-aware policy which takes precedence under OR semantics).
drop policy if exists memberships_read_self on public.tenant_memberships;
create policy memberships_read_self on public.tenant_memberships
  for select
  to authenticated
  using (user_id = auth.uid());

-- TENANTS ---------------------------------------------------------------------
alter table public.tenants enable row level security;

drop policy if exists tenants_read_member on public.tenants;
create policy tenants_read_member on public.tenants
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tenant_memberships
      where tenant_memberships.tenant_id = tenants.id
        and tenant_memberships.user_id   = auth.uid()
        and tenant_memberships.is_active = true
    )
  );
