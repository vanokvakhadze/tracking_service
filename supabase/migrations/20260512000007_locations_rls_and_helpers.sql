-- Migration: RLS + helpers for the locations table
--
-- Adds the policies the /locations + /locations/new pages need:
--   * any active member of a tenant can SEE non-deleted locations
--   * only tenant admins can INSERT / UPDATE / DELETE
--
-- Adds two generated columns (latitude, longitude) computed from the PostGIS
-- center geography so the Next.js client can read coordinates as plain
-- numbers without PostGIS-specific decoding on the wire.
--
-- Adds the create_location RPC so the server action can send lat/lng pairs
-- and let Postgres build the geography in-place.

-- 1) Generated lat/lng columns ------------------------------------------------
alter table public.locations
  add column if not exists latitude double precision
    generated always as (ST_Y(center::geometry)) stored,
  add column if not exists longitude double precision
    generated always as (ST_X(center::geometry)) stored;

-- 2) RLS policies (RLS already enabled in the base schema) -------------------
drop policy if exists locations_member_read on public.locations;
create policy locations_member_read on public.locations
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from public.tenant_memberships m
      where m.user_id = auth.uid()
        and m.tenant_id = locations.tenant_id
        and m.is_active = true
    )
  );

drop policy if exists locations_admin_insert on public.locations;
create policy locations_admin_insert on public.locations
  for insert
  to authenticated
  with check (public.is_tenant_admin(tenant_id));

drop policy if exists locations_admin_update on public.locations;
create policy locations_admin_update on public.locations
  for update
  to authenticated
  using (public.is_tenant_admin(tenant_id))
  with check (public.is_tenant_admin(tenant_id));

drop policy if exists locations_admin_delete on public.locations;
create policy locations_admin_delete on public.locations
  for delete
  to authenticated
  using (public.is_tenant_admin(tenant_id));

-- 3) create_location RPC -----------------------------------------------------
-- Accepts numeric lat/lng; builds the PostGIS POINT geography internally and
-- enforces the admin check via is_tenant_admin().
create or replace function public.create_location(
  p_tenant_id  uuid,
  p_name       text,
  p_category   location_category,
  p_address    text,
  p_latitude   double precision,
  p_longitude  double precision,
  p_radius_m   integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception 'Only tenant admins may create locations' using errcode = '42501';
  end if;

  if p_radius_m < 50 or p_radius_m > 5000 then
    raise exception 'Radius must be between 50 and 5000 meters' using errcode = '22023';
  end if;

  if p_latitude < -90 or p_latitude > 90 or p_longitude < -180 or p_longitude > 180 then
    raise exception 'Invalid coordinates' using errcode = '22023';
  end if;

  insert into public.locations (
    tenant_id, name, category, address, center, radius_m, created_by_user_id
  )
  values (
    p_tenant_id,
    p_name,
    p_category,
    p_address,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    p_radius_m,
    auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_location(
  uuid, text, location_category, text, double precision, double precision, integer
) from public;
grant execute on function public.create_location(
  uuid, text, location_category, text, double precision, double precision, integer
) to authenticated;
