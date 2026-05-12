-- Migration: auth.uid()-aware RLS on shifts + location_pings + device_status_logs.
--
-- Migration 03/04 covered users/memberships/tenants/invitations/locations.
-- Mobile screens (HomeScreen, HistoryScreen, MapScreen) need to read the
-- current user's own shifts + pings; admin reports need to read everything
-- in their tenant. Both flows replace the legacy
-- current_setting('app.current_tenant') policy that never matches under
-- Supabase Auth.

-- SHIFTS ---------------------------------------------------------------------
drop policy if exists shifts_member_read_own on public.shifts;
create policy shifts_member_read_own on public.shifts
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists shifts_admin_read_tenant on public.shifts;
create policy shifts_admin_read_tenant on public.shifts
  for select
  to authenticated
  using (public.is_tenant_admin(tenant_id));

-- LOCATION_PINGS ------------------------------------------------------------
drop policy if exists pings_member_read_own on public.location_pings;
create policy pings_member_read_own on public.location_pings
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists pings_admin_read_tenant on public.location_pings;
create policy pings_admin_read_tenant on public.location_pings
  for select
  to authenticated
  using (public.is_tenant_admin(tenant_id));

-- DWELL_RECORDS -------------------------------------------------------------
drop policy if exists dwell_member_read_own on public.dwell_records;
create policy dwell_member_read_own on public.dwell_records
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists dwell_admin_read_tenant on public.dwell_records;
create policy dwell_admin_read_tenant on public.dwell_records
  for select
  to authenticated
  using (public.is_tenant_admin(tenant_id));

-- GEOFENCE_EVENTS -----------------------------------------------------------
drop policy if exists geofence_events_member_read_own on public.geofence_events;
create policy geofence_events_member_read_own on public.geofence_events
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists geofence_events_admin_read_tenant on public.geofence_events;
create policy geofence_events_admin_read_tenant on public.geofence_events
  for select
  to authenticated
  using (public.is_tenant_admin(tenant_id));

-- DEVICE_STATUS_LOGS --------------------------------------------------------
drop policy if exists device_status_member_read_own on public.device_status_logs;
create policy device_status_member_read_own on public.device_status_logs
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists device_status_admin_read_tenant on public.device_status_logs;
create policy device_status_admin_read_tenant on public.device_status_logs
  for select
  to authenticated
  using (public.is_tenant_admin(tenant_id));
