-- Migration: split locations.radius_m into trigger + boundary radii
alter table public.locations
  add column if not exists trigger_radius_m integer,
  add column if not exists boundary_radius_m integer;

-- Backfill: existing radius_m becomes boundary; trigger = 1/3 (min 50, max 300)
update public.locations
   set boundary_radius_m = coalesce(boundary_radius_m, radius_m),
       trigger_radius_m  = coalesce(trigger_radius_m,
                                    least(300, greatest(50, radius_m / 3)))
 where boundary_radius_m is null or trigger_radius_m is null;

alter table public.locations
  alter column trigger_radius_m set not null,
  alter column boundary_radius_m set not null,
  add constraint locations_radii_ordering check (trigger_radius_m <= boundary_radius_m);

-- Replace create_location to take both radii.
create or replace function public.create_location(
  p_tenant_id         uuid,
  p_name              text,
  p_category          location_category,
  p_address           text,
  p_latitude          double precision,
  p_longitude         double precision,
  p_trigger_radius_m  integer,
  p_boundary_radius_m integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception 'Only tenant admins may create locations' using errcode = '42501';
  end if;
  if p_trigger_radius_m < 50 or p_trigger_radius_m > 1500 then
    raise exception 'Trigger radius out of range';
  end if;
  if p_boundary_radius_m < 100 or p_boundary_radius_m > 5000 then
    raise exception 'Boundary radius out of range';
  end if;
  if p_trigger_radius_m > p_boundary_radius_m then
    raise exception 'Trigger must be <= Boundary';
  end if;

  insert into public.locations (
    tenant_id, name, category, address, center,
    radius_m, trigger_radius_m, boundary_radius_m, created_by_user_id
  )
  values (
    p_tenant_id, p_name, p_category, p_address,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    p_boundary_radius_m, p_trigger_radius_m, p_boundary_radius_m,
    auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_location(
  uuid, text, location_category, text, double precision, double precision, integer, integer
) to authenticated;

-- Keep the legacy single-radius signature working by treating it as Boundary.
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
begin
  return public.create_location(
    p_tenant_id,
    p_name,
    p_category,
    p_address,
    p_latitude,
    p_longitude,
    least(300, greatest(50, p_radius_m / 3)),
    p_radius_m
  );
end;
$$;

grant execute on function public.create_location(
  uuid, text, location_category, text, double precision, double precision, integer
) to authenticated;
