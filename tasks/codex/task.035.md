# task.035 — Provisional locations inbox (Phase 2 — Task 2.10)

**Type:** 🤖 Codex
**Depends on:** task.034 + Phase 3 Task 3.11 (employee marks ad-hoc location)
**Commit:** `feat(web): add provisional locations approval inbox`

---

## Read first
- `tasks/00_AI_AGENT_RULES.md`
- Mockup: `tasks/reference/designs/27_provisional_inbox.png`

## Goal
Employees on mobile can photograph a location and submit it for admin review
(Phase 3 Task 3.11 does the submission side). This task builds the admin
side: a 3-column grid of pending submissions at `/locations/pending`, each
with photo + employee + location + map preview, and Approve / Reject actions.

Approve → flips status to `active`, creating a real location.
Reject → records reason, keeps row archived.

---

## Pre-work: schema

Create `supabase/migrations/<YYYYMMDD>_locations_provisional.sql`:

```sql
-- Migration: extend locations with submission lifecycle for provisional flows
do $$ begin
  create type location_status as enum ('active', 'pending_approval', 'rejected', 'archived');
exception when duplicate_object then null; end $$;

alter table public.locations
  add column if not exists status         location_status not null default 'active',
  add column if not exists photo_url      text,
  add column if not exists submitted_at   timestamptz,
  add column if not exists reviewed_at    timestamptz,
  add column if not exists reviewed_by    uuid references public.users(id),
  add column if not exists rejection_note text;

-- Provisional submissions don't yet have a name picked — keep name nullable
-- in the pending state only; on approval the admin sets the final name.
alter table public.locations
  drop constraint if exists locations_name_required_when_active;
alter table public.locations
  add constraint locations_name_required_when_active
  check (status <> 'active' or (name is not null and length(name) >= 2));

-- Allow active members (not just admins) to INSERT pending submissions
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
  p_id    uuid,
  p_name  text
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
     set status      = 'active',
         name        = coalesce(p_name, name),
         reviewed_at = now(),
         reviewed_by = auth.uid()
   where id = p_id;
end;
$$;

create or replace function public.reject_location(
  p_id     uuid,
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
     set status         = 'rejected',
         rejection_note = p_reason,
         reviewed_at    = now(),
         reviewed_by    = auth.uid()
   where id = p_id;
end;
$$;

grant execute on function public.approve_location(uuid, text) to authenticated;
grant execute on function public.reject_location(uuid, text)  to authenticated;
```

Run `pnpm db:types`.

Also create a Supabase Storage bucket `provisional-photos` (private, signed-URL reads). RLS on `storage.objects`:

```sql
create policy "provisional_photos_member_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'provisional-photos'
    and exists (
      select 1 from public.tenant_memberships m
      where m.user_id = auth.uid() and m.is_active = true
    )
  );
```

## Files to add

- `apps/web/app/(app)/locations/pending/page.tsx` — server fetches `status = 'pending_approval'` rows
- `apps/web/app/(app)/locations/pending/actions.ts` — `approveLocation` + `rejectLocation` server actions
- `apps/web/components/locations/ProvisionalCard.tsx` — single submission card (photo + meta + Approve / Reject buttons)
- `apps/web/components/locations/RejectDialog.tsx` — confirms rejection with a required note (Dialog primitive already exists)

## Acceptance criteria
- [ ] Sidebar already shows "მოლოდინში" with a badge — that count now reflects real `pending_approval` rows
- [ ] `/locations/pending` (admin only): 3-column responsive grid, each card shows photo, employee initials + name, lat/lng, distance from nearest active location, submitted-at relative time
- [ ] Approve → opens small dialog asking for the final location name + category, calls `approve_location` RPC, row disappears from inbox, appears in `/locations`
- [ ] Reject → opens `RejectDialog`, requires a note, calls `reject_location` RPC
- [ ] Empty state when no pending: friendly message + sidebar badge becomes 0

## Commit
```powershell
git add supabase/migrations apps/web packages/database/src/types.ts
git commit -m "feat(web): add provisional locations approval inbox"
```

## DO NOT
- ❌ Build the mobile submission side here — that is Phase 3 Task 3.11
- ❌ Send email/push to employee on approval — push lives in Phase 3 Task 3.5
- ❌ Allow non-admins to call the approve/reject RPCs (handled by `is_tenant_admin`)
