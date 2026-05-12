-- Migration: fix RLS infinite recursion in admin policies
--
-- Migration 04 + 05 introduced admin policies on users / tenant_memberships /
-- tenants / invitations that each queried tenant_memberships from inside the
-- USING clause. Because tenant_memberships itself has RLS, the policy
-- evaluation entered an infinite loop, surfacing as:
--
--   ERROR: 42P17 infinite recursion detected in policy for relation ...
--
-- Fix: route the "is auth.uid() an admin of tenant X" check through a
-- SECURITY DEFINER helper function. Functions in security-definer mode run as
-- the owner and bypass RLS during their own SELECT, so the policies can call
-- the helper without re-triggering policy evaluation.

create or replace function public.is_tenant_admin(p_tenant_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships
    where user_id   = auth.uid()
      and tenant_id = p_tenant_id
      and is_active = true
      and role in ('tenant_admin', 'super_admin')
  );
$$;

revoke all on function public.is_tenant_admin(uuid) from public;
grant execute on function public.is_tenant_admin(uuid) to authenticated;

-- USERS: admin sees tenant members (rewritten without recursion) -------------
drop policy if exists users_admin_read_tenant on public.users;
create policy users_admin_read_tenant on public.users
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tenant_memberships them
      where them.user_id = users.id
        and public.is_tenant_admin(them.tenant_id)
    )
  );

-- TENANT_MEMBERSHIPS: admin sees + updates tenant memberships ----------------
drop policy if exists memberships_admin_read_tenant on public.tenant_memberships;
create policy memberships_admin_read_tenant on public.tenant_memberships
  for select
  to authenticated
  using (public.is_tenant_admin(tenant_memberships.tenant_id));

drop policy if exists memberships_admin_update on public.tenant_memberships;
create policy memberships_admin_update on public.tenant_memberships
  for update
  to authenticated
  using (public.is_tenant_admin(tenant_memberships.tenant_id))
  with check (public.is_tenant_admin(tenant_memberships.tenant_id));

-- TENANTS: admin updates own tenant ------------------------------------------
drop policy if exists tenants_admin_update on public.tenants;
create policy tenants_admin_update on public.tenants
  for update
  to authenticated
  using (public.is_tenant_admin(tenants.id))
  with check (public.is_tenant_admin(tenants.id));

-- INVITATIONS: admin select/insert (also touched tenant_memberships) ---------
drop policy if exists invitations_admin_select on public.invitations;
create policy invitations_admin_select on public.invitations
  for select
  to authenticated
  using (public.is_tenant_admin(invitations.tenant_id));

drop policy if exists invitations_admin_insert on public.invitations;
create policy invitations_admin_insert on public.invitations
  for insert
  to authenticated
  with check (public.is_tenant_admin(invitations.tenant_id));
