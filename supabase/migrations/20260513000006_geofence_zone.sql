-- Migration: track which zone (trigger | boundary) fired a geofence event.
--
-- Phase 3-Lite registers TWO OS regions per location — a small "trigger"
-- ring that flips shift state, and a larger "boundary" ring that only
-- alerts. The geofence_events table previously had no way to tell them
-- apart, so the admin alerts inbox was conflating normal shift ends
-- with "user left the work zone" incidents. The new column lets the
-- alerts RPC filter cleanly.

alter table public.geofence_events
  add column if not exists zone text not null default 'trigger'
    check (zone in ('trigger', 'boundary'));

create index if not exists geofence_events_zone_idx
  on public.geofence_events(tenant_id, zone, event_type, occurred_at desc);

-- Update get_admin_alerts to only surface BOUNDARY exits (the real
-- "left the work zone" event). Trigger exits are normal shift ends and
-- should not page anyone.
create or replace function public.get_admin_alerts(
  p_tenant_id uuid,
  p_since timestamptz default now() - interval '7 days'
)
returns table (
  id text,
  severity text,
  kind text,
  user_id uuid,
  user_name text,
  occurred_at timestamptz,
  details jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_tenant_admin(p_tenant_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return query
  select
    ('ping:' || p.id)::text,
    'critical'::text,
    'mock_gps'::text,
    p.user_id,
    coalesce(nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email)::text,
    p.recorded_at,
    jsonb_build_object('accuracy_m', p.accuracy_m) as details
  from public.location_pings p
  join public.users u on u.id = p.user_id
  where p.tenant_id = p_tenant_id
    and p.is_mock = true
    and p.recorded_at >= p_since

  union all

  select
    ('loc_off:' || d.id)::text,
    'critical'::text,
    'location_disabled'::text,
    d.user_id,
    coalesce(nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email)::text,
    d.reported_at,
    jsonb_build_object('has_permission', d.has_location_permission) as details
  from public.device_status_logs d
  join public.users u on u.id = d.user_id
  where d.tenant_id = p_tenant_id
    and d.is_location_enabled = false
    and d.reported_at >= p_since

  union all

  select
    ('battery:' || d.id)::text,
    'warning'::text,
    'low_battery'::text,
    d.user_id,
    coalesce(nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email)::text,
    d.reported_at,
    jsonb_build_object('battery_percent', d.battery_percent) as details
  from public.device_status_logs d
  join public.users u on u.id = d.user_id
  where d.tenant_id = p_tenant_id
    and d.battery_percent < 15
    and d.reported_at >= p_since

  union all

  select
    ('zone:' || e.id)::text,
    'warning'::text,
    'out_of_zone'::text,
    e.user_id,
    coalesce(nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email)::text,
    e.occurred_at,
    jsonb_build_object('location_name', l.name) as details
  from public.geofence_events e
  join public.users u on u.id = e.user_id
  join public.shifts s on s.id = e.shift_id and s.status = 'active'
  left join public.locations l on l.id = e.location_id
  where e.tenant_id = p_tenant_id
    and e.zone = 'boundary'
    and e.event_type = 'exit'
    and e.occurred_at >= p_since
    and e.occurred_at <= now() - interval '1 hour'
    and not exists (
      select 1
      from public.geofence_events r
      where r.tenant_id = e.tenant_id
        and r.user_id = e.user_id
        and r.location_id = e.location_id
        and r.zone = 'boundary'
        and r.event_type = 'enter'
        and r.occurred_at > e.occurred_at
    )
  order by 6 desc
  limit 200;
end;
$$;
