-- Migration: per-tenant alert notification preferences.
--
-- Stores one row per (tenant, alert_kind) pair, controlling whether the
-- admin alert is pushed to the Expo devices of tenant admins and/or
-- emailed to a configurable recipients list.
--
-- Push: routed via the existing geofence-event Edge Function (and any
-- future alert producer) which checks this table before fan-out.
-- Email: stub for now -- the row stores intent, the send happens only
-- when a transactional email provider is configured (see RESEND_API_KEY
-- environment variable in the Edge Function).

create table if not exists public.tenant_alert_settings (
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  alert_kind       text not null,
  push_enabled     boolean not null default true,
  email_enabled    boolean not null default false,
  email_recipients text[]  not null default '{}',
  updated_at       timestamptz not null default now(),
  primary key (tenant_id, alert_kind),
  constraint tenant_alert_settings_kind_check check (
    alert_kind in ('mock_gps', 'location_disabled', 'low_battery', 'out_of_zone')
  )
);

alter table public.tenant_alert_settings enable row level security;

-- Admins read + write their tenant's settings; everyone else: no access.
drop policy if exists alert_settings_admin_read on public.tenant_alert_settings;
create policy alert_settings_admin_read on public.tenant_alert_settings
  for select
  to authenticated
  using (public.is_tenant_admin(tenant_id));

drop policy if exists alert_settings_admin_upsert on public.tenant_alert_settings;
create policy alert_settings_admin_upsert on public.tenant_alert_settings
  for insert
  to authenticated
  with check (public.is_tenant_admin(tenant_id));

drop policy if exists alert_settings_admin_update on public.tenant_alert_settings;
create policy alert_settings_admin_update on public.tenant_alert_settings
  for update
  to authenticated
  using (public.is_tenant_admin(tenant_id))
  with check (public.is_tenant_admin(tenant_id));

-- Seed existing tenants with default rows (idempotent).
insert into public.tenant_alert_settings (tenant_id, alert_kind, push_enabled, email_enabled)
select t.id, k.kind, true, false
from public.tenants t
cross join (values
  ('mock_gps'),
  ('location_disabled'),
  ('low_battery'),
  ('out_of_zone')
) as k(kind)
on conflict do nothing;

-- Trigger: when a new tenant is created, seed the 4 default rows.
create or replace function public.seed_tenant_alert_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tenant_alert_settings (tenant_id, alert_kind)
  values
    (new.id, 'mock_gps'),
    (new.id, 'location_disabled'),
    (new.id, 'low_battery'),
    (new.id, 'out_of_zone')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_seed_tenant_alert_settings on public.tenants;
create trigger trg_seed_tenant_alert_settings
  after insert on public.tenants
  for each row execute function public.seed_tenant_alert_settings();

-- updated_at touch trigger.
create or replace function public.touch_tenant_alert_settings()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_tenant_alert_settings on public.tenant_alert_settings;
create trigger trg_touch_tenant_alert_settings
  before update on public.tenant_alert_settings
  for each row execute function public.touch_tenant_alert_settings();
