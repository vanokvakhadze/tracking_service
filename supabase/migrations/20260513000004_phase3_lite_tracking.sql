-- Migration: Phase 3-Lite background tracking support.
--
-- Adds user_devices for push-token storage so the geofence Edge Function can
-- notify a user when their shift auto-starts/ends. Tokens are upserted from
-- mobile on every app launch (after the user grants notifications).

create table if not exists public.user_devices (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  expo_push_token text not null,
  platform      text not null check (platform in ('ios', 'android')),
  app_version   text,
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create index if not exists user_devices_user_idx on public.user_devices(user_id);

alter table public.user_devices enable row level security;

-- Users can manage their own tokens. Service role bypasses RLS for the
-- Edge Function that fans out notifications.
drop policy if exists user_devices_owner_all on public.user_devices;
create policy user_devices_owner_all on public.user_devices
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Tenant admins can read tokens for users in their tenant (for re-sending
-- onboarding pushes etc.) — joined through tenant_memberships.
drop policy if exists user_devices_admin_read on public.user_devices;
create policy user_devices_admin_read on public.user_devices
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tenant_memberships m
      where m.user_id = public.user_devices.user_id
        and public.is_tenant_admin(m.tenant_id)
    )
  );
