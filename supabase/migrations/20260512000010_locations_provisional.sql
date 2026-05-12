-- Migration: extend locations with submission lifecycle for provisional flows
do $$ begin
  create type location_status as enum ('active', 'pending_approval', 'rejected', 'archived');
exception when duplicate_object then null; end $$;

alter table public.locations
  add column if not exists status location_status not null default 'active',
  add column if not exists photo_url text,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.users(id),
  add column if not exists rejection_note text;

-- Provisional submissions do not yet have a final name. Keep name nullable in
-- pending states only; on approval the admin sets the final name.
alter table public.locations
  alter column name drop not null;
alter table public.locations
  drop constraint if exists locations_name_required_when_active;
alter table public.locations
  add constraint locations_name_required_when_active
  check (status <> 'active' or (name is not null and length(name) >= 2));

-- Allow active members (not just admins) to INSERT pending submissions.
drop policy if exists locations_member_submit on public.locations;
create policy locations_member_submit on public.locations
  for insert
  to authenticated
  with check (
    status = 'pending_approval'
    and exists (
      select 1 from public.tenant_memberships m
      where m.user_id = auth.uid()
        and m.tenant_id = locations.tenant_id
        and m.is_active = true
    )
  );

-- RPC for the approval flow (admin only)
create or replace function public.approve_location(
  p_id uuid,
  p_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_tenant uuid;
begin
  select tenant_id into v_tenant from public.locations where id = p_id;
  if v_tenant is null then raise exception 'Not found'; end if;
  if not public.is_tenant_admin(v_tenant) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  update public.locations
     set status = 'active',
         name = coalesce(p_name, name),
         reviewed_at = now(),
         reviewed_by = auth.uid()
   where id = p_id;
end;
$$;

create or replace function public.reject_location(
  p_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_tenant uuid;
begin
  select tenant_id into v_tenant from public.locations where id = p_id;
  if not public.is_tenant_admin(v_tenant) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  update public.locations
     set status = 'rejected',
         rejection_note = p_reason,
         reviewed_at = now(),
         reviewed_by = auth.uid()
   where id = p_id;
end;
$$;

grant execute on function public.approve_location(uuid, text) to authenticated;
grant execute on function public.reject_location(uuid, text) to authenticated;

insert into storage.buckets (id, name, public)
values ('provisional-photos', 'provisional-photos', false)
on conflict (id) do update set public = false;

drop policy if exists "provisional_photos_member_read" on storage.objects;
create policy "provisional_photos_member_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'provisional-photos'
    and exists (
      select 1 from public.tenant_memberships m
      where m.user_id = auth.uid() and m.is_active = true
    )
  );
