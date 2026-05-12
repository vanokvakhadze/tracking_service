# task.034 — Work Zone configuration page (Phase 2 — Task 2.7)

**Type:** 🤖 Codex
**Depends on:** task.033 + Phase 2 base (admin app shell, /locations list)
**Commit:** `feat(web): add work zone configuration page with two-zone radii`

---

## Read first
- `tasks/00_AI_AGENT_RULES.md`
- `tasks/reference/GEOFENCE_DESIGN_RULES.md` § Two-Zone Architecture, § Hysteresis
- Mockup: `tasks/reference/designs/30_web_work_zone.png`

## Goal
The reference schema's `locations.radius_m` represents a single zone. The
geofence rules require **two zones per location**: a small **Trigger** (where
the shift fires) and a larger **Boundary** (the operational fence). This task:

1. Adds `trigger_radius_m` + `boundary_radius_m` columns to `locations` and
   backfills them from the existing `radius_m`.
2. Updates `create_location` RPC to accept both radii.
3. Builds `/locations/[id]/work-zone` (admin only): split view — config form
   on the left, Mapbox map on the right showing both circles.

> Hysteresis values (entry 30s, exit 60s) and mock-GPS toggles are platform-
> level rules, not per-location settings, so they are read-only labels in the
> UI for now — the SDK config (Task 3.2) will own them.

---

## Pre-work: write a new migration

Create `supabase/migrations/<YYYYMMDD>_locations_two_zone.sql`:

```sql
-- Migration: split locations.radius_m into trigger + boundary radii
alter table public.locations
  add column if not exists trigger_radius_m  integer,
  add column if not exists boundary_radius_m integer;

-- Backfill: existing radius_m becomes boundary; trigger = 1/3 (min 50, max 300)
update public.locations
   set boundary_radius_m = coalesce(boundary_radius_m, radius_m),
       trigger_radius_m  = coalesce(trigger_radius_m,
                                    least(300, greatest(50, radius_m / 3)))
 where boundary_radius_m is null or trigger_radius_m is null;

alter table public.locations
  alter column trigger_radius_m  set not null,
  alter column boundary_radius_m set not null,
  add constraint locations_radii_ordering check (trigger_radius_m <= boundary_radius_m);

-- Replace create_location to take both radii; keep old signature working with
-- a sensible split.
create or replace function public.create_location(
  p_tenant_id          uuid,
  p_name               text,
  p_category           location_category,
  p_address            text,
  p_latitude           double precision,
  p_longitude          double precision,
  p_trigger_radius_m   integer,
  p_boundary_radius_m  integer
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
  if p_trigger_radius_m  < 50  or p_trigger_radius_m  > 1500 then
    raise exception 'Trigger radius out of range';
  end if;
  if p_boundary_radius_m < 100 or p_boundary_radius_m > 5000 then
    raise exception 'Boundary radius out of range';
  end if;
  if p_trigger_radius_m > p_boundary_radius_m then
    raise exception 'Trigger must be ≤ Boundary';
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
```

Run `pnpm db:types` after applying.

## Files to add

- `apps/web/app/(app)/locations/[id]/work-zone/page.tsx` (server, fetches the location + admin check)
- `apps/web/app/(app)/locations/[id]/work-zone/update-action.ts` (server action: update trigger + boundary)
- `apps/web/components/locations/WorkZoneConfig.tsx` (client, split layout)

## Files to modify

- `apps/web/components/locations/LocationCreateForm.tsx` — split radius slider into TWO sliders (trigger + boundary), Zod validates trigger ≤ boundary
- `apps/web/app/(app)/locations/new/create-action.ts` — send both radii in the RPC call
- `apps/web/components/map/MapboxMap.tsx` — extend `radiusM` prop to accept either a number (single ring) or `{ trigger: number; boundary: number }` (two rings, trigger inner darker)

## Acceptance criteria
- [ ] Migration applied; `pnpm db:types` shows the new columns on `locations`
- [ ] `/locations/new` form has two radius sliders; submit fails if trigger > boundary
- [ ] `/locations/[id]/work-zone` renders with both circles on the map; saving updates both values; refresh shows new values
- [ ] Map shows trigger as the inner darker circle, boundary as the lighter outer circle
- [ ] Non-admin viewing the work-zone page sees "admin-only" message

## Commit
```powershell
git add supabase/migrations apps/web packages/database/src/types.ts
git commit -m "feat(web): add work zone configuration page with two-zone radii"
```

## DO NOT
- ❌ Drop the existing `radius_m` column — it still exists for backwards compatibility and equals boundary
- ❌ Wire hysteresis values per-location yet; those are platform settings (Phase 3)
