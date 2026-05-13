# task.042 — Admin create location: form step (mobile)

**Type:** 🤖 Codex
**Phase:** 4 — Mobile Admin
**Depends on:** task.041
**Commit:** `feat(mobile): admin location create — form step`

---

## Read first
- `tasks/00_HANDOFF.md`
- `apps/web/components/locations/LocationCreateForm.tsx` (web parity: name, category, two radii sliders)
- `apps/web/app/(app)/locations/new/create-action.ts` (server action calling `create_location` RPC)
- Mockup: `tasks/reference/designs/29_admin_create_form.png`

## Goal
Second screen of the admin location-create flow. Reads lat/lng/address from route params (set in task.041), shows a compact map preview + a form, calls the `create_location` RPC, and on success navigates back to the admin dashboard.

Status is `active` immediately (admin authority — not pending_approval).

## Files to add

### `apps/mobile/src/services/admin-locations.ts`
```ts
interface CreateLocationInput {
  tenantId: string
  name: string
  category: 'office' | 'client_site' | 'warehouse' | 'checkpoint' | 'other'
  address: string | null
  latitude: number
  longitude: number
  triggerRadiusM: number
  boundaryRadiusM: number
}

export async function createAdminLocation(input: CreateLocationInput): Promise<string>
```

Calls `supabase.rpc('create_location', { p_tenant_id, p_name, p_category, p_address, p_latitude, p_longitude, p_trigger_radius_m, p_boundary_radius_m })`. Returns the new location id.

### `apps/mobile/src/screens/admin/CreateLocationFormScreen.tsx`
- Reads params via `useLocalSearchParams()` from expo-router
- Compact map preview at the top showing the picked pin + Trigger circle (use the `MapNativeScreen` pattern; fallback in Expo Go is a static placeholder card with lat/lng readouts)
- Form fields:
  - `name` — required, min 2
  - `category` — select (Georgian labels: ოფისი / კლიენტი / საწყობი / საკონტროლო / სხვა)
  - `address` — pre-filled from params (read-only with an "edit" link → goes back)
  - `triggerRadius` slider, 50–1500 m, default 100
  - `boundaryRadius` slider, 100–5000 m, default 200
- Inline Zod-style validation: trigger ≤ boundary
- Submit: call `createAdminLocation`, then `router.replace('/admin-dashboard')` and surface a toast/Alert
- Loading + error states

### `apps/mobile/app/admin-location-form.tsx`
Route shim that exports `CreateLocationFormScreen` as default.

## Acceptance criteria
- [ ] Form pre-fills address from route params
- [ ] Trigger slider clamps to ≤ boundary; UI shows a warning if violated
- [ ] Submit creates a row visible in `/locations` on web within seconds (status='active')
- [ ] Cancel/back navigates to the map step (not the dashboard)
- [ ] Non-admin user opening the route gets a "მხოლოდ ადმინისთვის" notice
- [ ] typecheck + format:check pass

## Commit
```powershell
git add apps/mobile/src/services/admin-locations.ts apps/mobile/src/screens/admin/CreateLocationFormScreen.tsx apps/mobile/app/admin-location-form.tsx
git commit -m "feat(mobile): admin location create — form step"
```

## DO NOT
- ❌ Re-implement `create_location` in client code — always go through the RPC (preserves the admin check + radius validation)
- ❌ Persist draft state to MMKV — single-session draft is fine for v1
- ❌ Set `status='pending_approval'` — admin path is always `active`
