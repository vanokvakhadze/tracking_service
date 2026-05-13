-- Migration: admin alerts RPC.
--
-- Derives the mobile admin alerts inbox from existing event tables. No alerts
-- table is introduced; the RPC remains tenant-admin scoped through the
-- SECURITY DEFINER helper from migration 06.

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
    and e.event_type = 'exit'
    and e.occurred_at >= p_since
    and e.occurred_at <= now() - interval '1 hour'
    and not exists (
      select 1
      from public.geofence_events r
      where r.tenant_id = e.tenant_id
        and r.user_id = e.user_id
        and r.location_id = e.location_id
        and r.event_type = 'enter'
        and r.occurred_at > e.occurred_at
    )
  order by 6 desc
  limit 200;
end;
$$;

revoke all on function public.get_admin_alerts(uuid, timestamptz) from public;
grant execute on function public.get_admin_alerts(uuid, timestamptz) to authenticated;
