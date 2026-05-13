# task.043 — Work Zone configuration (mobile admin)

**Type:** 🤖 Codex
**Phase:** 4 — Mobile Admin
**Depends on:** task.036 + migration 09 applied (two-zone radii on locations)
**Commit:** `feat(mobile): admin work zone configuration`

---

## Read first
- `tasks/00_HANDOFF.md`
- `apps/web/components/locations/WorkZoneConfig.tsx` (web parity — same two sliders + nested circles)
- `apps/web/app/(app)/locations/[id]/work-zone/update-action.ts` (server action)
- Mockup: `tasks/reference/designs/31_mobile_work_zone.png`

## Goal
A per-location screen on mobile that lets an admin edit the Trigger + Boundary radii. Reached from a "სამუშაო ზონა" action in the Team Map (task.038) bottom sheet or from the Admin Dashboard's location list. For v1 just register the route — entry points elsewhere can be wired separately.

## Files to add

### `apps/mobile/src/services/work-zone.ts`
```ts
interface WorkZoneLocation {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  trigger_radius_m: number
  boundary_radius_m: number
}

export async function fetchWorkZone(locationId: string): Promise<WorkZoneLocation | null>
export async function updateWorkZone(input: {
  locationId: string
  triggerRadiusM: number
  boundaryRadiusM: number
}): Promise<void>
```

`updateWorkZone` does:
```ts
await supabase
  .from('locations')
  .update({
    trigger_radius_m: input.triggerRadiusM,
    boundary_radius_m: input.boundaryRadiusM,
    radius_m: input.boundaryRadiusM, // keep legacy column in sync
  })
  .eq('id', input.locationId)
```

RLS `locations_admin_update` (migration 07/06) gates this.

### `apps/mobile/src/screens/admin/WorkZoneScreen.tsx`
- Header with location name + address
- Compact MapView preview at the top (nested Trigger blue + Boundary amber circles, scaled to fit)
- Info card explaining the two zones with the design rules' hysteresis values (read-only):
  - ENTRY → SHIFT_START
  - EXIT  → SHIFT_END
  - "შესვლა: 30 წამი, გასვლა: 60 წამი"
- Two slider cards:
  - Trigger 50–1500 m (KAYA accent)
  - Boundary 100–5000 m (KAYA warning)
- Validation: trigger ≤ boundary; show inline error if violated
- Save → `updateWorkZone` → success toast → `router.back()`

### `apps/mobile/app/work-zone/[id].tsx`
Route shim that pulls the id from `useLocalSearchParams()` and renders `<WorkZoneScreen locationId={id} />`. Modal presentation.

## Files to modify

### `apps/mobile/app/_layout.tsx`
Register `work-zone/[id]` inside the `authedAndOnboarded` Stack.Protected block (modal presentation).

## Acceptance criteria
- [ ] Loading the route for a real location id pre-fills both sliders from DB
- [ ] Trigger > Boundary blocks save (error inline, button disabled)
- [ ] Save updates DB; the web `/locations` list shows the new radius value
- [ ] Non-admin gets "მხოლოდ ადმინისთვის" notice
- [ ] Expo Go fallback for the map preview (the rest of the screen still works)
- [ ] typecheck + format:check pass

## Commit
```powershell
git add apps/mobile/src/services/work-zone.ts apps/mobile/src/screens/admin/WorkZoneScreen.tsx apps/mobile/app/work-zone apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): admin work zone configuration"
```

## DO NOT
- ❌ Touch `radius_m` separately from the dual-radius update — always set both at once (legacy radius_m must equal boundary)
- ❌ Implement hysteresis settings here — those are platform-level (Phase 3 SDK config)
- ❌ Delete the location from this screen — destructive actions live elsewhere
