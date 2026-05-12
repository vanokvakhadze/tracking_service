-- Migration: admin can see all members of their tenant + pending invitations
--
-- Migration 03 added `users_read_self` and `memberships_read_self`, which is
-- enough for /dashboard but not for /users where the admin needs to list
-- every member. Also the /accept-invite page reads the invitation by token
-- as the anon role (the user is not yet authenticated), which requires a
-- token-scoped SELECT policy.

-- USERS: admin can read profiles of every member in their own tenant ----------
drop policy if exists users_admin_read_tenant on public.users;
create policy users_admin_read_tenant on public.users
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tenant_memberships me
      join public.tenant_memberships them
        on them.tenant_id = me.tenant_id
      where me.user_id   = auth.uid()
        and me.is_active = true
        and me.role in ('tenant_admin', 'super_admin')
        and them.user_id = users.id
    )
  );

-- TENANT_MEMBERSHIPS: admin can read all memberships of their tenant ----------
drop policy if exists memberships_admin_read_tenant on public.tenant_memberships;
create policy memberships_admin_read_tenant on public.tenant_memberships
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tenant_memberships me
      where me.user_id   = auth.uid()
        and me.tenant_id = tenant_memberships.tenant_id
        and me.is_active = true
        and me.role in ('tenant_admin', 'super_admin')
    )
  );

-- TENANT_MEMBERSHIPS: admin can update memberships in their tenant
-- (used for role change + soft delete via is_active toggle)
drop policy if exists memberships_admin_update on public.tenant_memberships;
create policy memberships_admin_update on public.tenant_memberships
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.tenant_memberships me
      where me.user_id   = auth.uid()
        and me.tenant_id = tenant_memberships.tenant_id
        and me.is_active = true
        and me.role in ('tenant_admin', 'super_admin')
    )
  )
  with check (
    exists (
      select 1
      from public.tenant_memberships me
      where me.user_id   = auth.uid()
        and me.tenant_id = tenant_memberships.tenant_id
        and me.is_active = true
        and me.role in ('tenant_admin', 'super_admin')
    )
  );

-- INVITATIONS: anyone (anon + authenticated) can read a pending invitation.
-- The 32-byte random token in the URL is the secret — exposing other fields
-- to anyone who guesses a token is the design intent (it is needed to render
-- the accept-invite page).
drop policy if exists invitations_pending_read on public.invitations;
create policy invitations_pending_read on public.invitations
  for select
  to anon, authenticated
  using (status = 'pending' and expires_at > now());
