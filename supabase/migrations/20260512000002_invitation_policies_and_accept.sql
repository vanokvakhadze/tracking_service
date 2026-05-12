-- Migration: invitation RLS policies + accept_invitation function
--
-- The reference schema enabled RLS on invitations but used the
-- `current_setting('app.current_tenant')` style policy, which is for a
-- non-Supabase-Auth deployment. Replace with auth.uid()-aware policies so
-- our Supabase Auth flow can use the table.
--
-- Also defines `accept_invitation` — SECURITY DEFINER so it can bypass RLS
-- on users + tenant_memberships to onboard the invited user atomically.

-- 1) Replace the legacy session-variable policy
drop policy if exists tenant_isolation on public.invitations;

-- Tenant admins can read invitations belonging to their tenant
create policy invitations_admin_select on public.invitations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tenant_memberships m
      where m.user_id = auth.uid()
        and m.tenant_id = invitations.tenant_id
        and m.role in ('tenant_admin', 'super_admin')
        and m.is_active = true
    )
  );

-- Tenant admins can create invitations for their own tenant
create policy invitations_admin_insert on public.invitations
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.tenant_memberships m
      where m.user_id = auth.uid()
        and m.tenant_id = invitations.tenant_id
        and m.role in ('tenant_admin', 'super_admin')
        and m.is_active = true
    )
  );

-- 2) Accept an invitation: validates token, creates profile + membership,
--    marks the invitation accepted. Returns the joined tenant_id.
create or replace function public.accept_invitation(
  p_token       text,
  p_user_id     uuid,
  p_first_name  text,
  p_last_name   text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.invitations%rowtype;
begin
  select * into v_inv
  from public.invitations
  where token = p_token
    and status = 'pending'
    and expires_at > now()
  limit 1;

  if not found then
    raise exception 'Invalid or expired invitation' using errcode = '22023';
  end if;

  -- Create or update user profile (keyed by auth.users.id)
  insert into public.users (id, email, first_name, last_name, email_verified_at)
  values (p_user_id, v_inv.email, p_first_name, p_last_name, now())
  on conflict (id) do update
    set first_name = excluded.first_name,
        last_name  = excluded.last_name;

  -- Add membership (idempotent: invitations_user_unique on tenant_memberships)
  insert into public.tenant_memberships (tenant_id, user_id, role, is_active)
  values (v_inv.tenant_id, p_user_id, v_inv.role, true)
  on conflict (tenant_id, user_id) do nothing;

  -- Mark invitation accepted
  update public.invitations
     set status = 'accepted',
         accepted_at = now()
   where id = v_inv.id;

  return v_inv.tenant_id;
end;
$$;

revoke all on function public.accept_invitation(text, uuid, text, text) from public;
grant execute on function public.accept_invitation(text, uuid, text, text) to authenticated;
