-- Migration: super admin (platform-level) RLS bypass policies
--
-- The base schema already has `users.is_super_admin boolean default false`.
-- This migration adds:
--   1. `public.is_super_admin()` helper — STABLE + SECURITY DEFINER so it
--      bypasses RLS during its own SELECT and can be cheaply called from
--      every policy.
--   2. "super_admin sees + mutates everything" policies on the tables that
--      back the /platform/* pages.
--
-- All other tenant-scoped policies already exist; super-admin policies are
-- additive (RLS is OR-semantics) so the tenant/employee paths keep working
-- unchanged.

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_super_admin from public.users where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

-- TENANTS ---------------------------------------------------------------------
drop policy if exists tenants_super_admin_all on public.tenants;
create policy tenants_super_admin_all on public.tenants
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- USERS -----------------------------------------------------------------------
drop policy if exists users_super_admin_all on public.users;
create policy users_super_admin_all on public.users
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- TENANT_MEMBERSHIPS ---------------------------------------------------------
drop policy if exists memberships_super_admin_all on public.tenant_memberships;
create policy memberships_super_admin_all on public.tenant_memberships
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- INVITATIONS -----------------------------------------------------------------
drop policy if exists invitations_super_admin_all on public.invitations;
create policy invitations_super_admin_all on public.invitations
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- LOCATIONS -------------------------------------------------------------------
drop policy if exists locations_super_admin_all on public.locations;
create policy locations_super_admin_all on public.locations
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- SHIFTS + tracking event tables ---------------------------------------------
drop policy if exists shifts_super_admin_all on public.shifts;
create policy shifts_super_admin_all on public.shifts
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists location_pings_super_admin_all on public.location_pings;
create policy location_pings_super_admin_all on public.location_pings
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists geofence_events_super_admin_all on public.geofence_events;
create policy geofence_events_super_admin_all on public.geofence_events
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists dwell_records_super_admin_all on public.dwell_records;
create policy dwell_records_super_admin_all on public.dwell_records
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists device_status_logs_super_admin_all on public.device_status_logs;
create policy device_status_logs_super_admin_all on public.device_status_logs
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- AUDIT_LOGS — make readable by super admin
alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_super_admin_read on public.audit_logs;
create policy audit_logs_super_admin_read on public.audit_logs
  for select
  to authenticated
  using (public.is_super_admin());

-- SUBSCRIPTION_PLANS — super admin can edit pricing tiers
drop policy if exists subscription_plans_super_admin_all on public.subscription_plans;
create policy subscription_plans_super_admin_all on public.subscription_plans
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Helper: insert into audit_logs from server actions / RPCs
create or replace function public.log_admin_action(
  p_action      text,
  p_entity_type text default null,
  p_entity_id   uuid default null,
  p_metadata    jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  insert into public.audit_logs (
    tenant_id, actor_user_id, action, entity_type, entity_id, metadata
  )
  values (
    null,                       -- tenant_id null for platform-level actions
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.log_admin_action(text, text, uuid, jsonb) to authenticated;
