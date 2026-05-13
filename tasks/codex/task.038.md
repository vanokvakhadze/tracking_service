# task.038 — Live team map (mobile admin)

**Type:** 🤖 Codex
**Phase:** 4 — Mobile Admin
**Depends on:** task.036, task.037
**Commit:** `feat(mobile): add live team map for admin`

---

## Read first
- `tasks/00_HANDOFF.md` — § Critical pitfalls #3 (react-native-maps Expo Go incompatibility)
- `apps/mobile/src/screens/employee/MapNativeScreen.tsx` (existing pattern)
- `apps/mobile/app/(tabs)/map.tsx` (existing conditional dispatcher)
- Mockup: `tasks/reference/designs/07_admin_map.png`

## Goal
Extend the existing `map.tsx` dispatch so admins see a **team map** — all team members' last-known positions on top of geofences. Employees keep seeing the existing per-user view.

> ⚠️ react-native-maps does NOT work in Expo Go. The fallback (sees the list view) already handles that case. Real map only runs in dev / standalone builds.

## Files to add

### `apps/mobile/src/services/team-positions.ts`
Returns last known ping per active team member:
```ts
interface TeamPosition {
  user_id: string
  user_name: string
  user_initials: string
  latitude: number
  longitude: number
  recorded_at: string
  status: 'active' | 'alert' | 'warning' | 'offline'
}

export async function fetchTeamPositions(): Promise<TeamPosition[]>
```

Status rules (v1):
- `active` → user has an active shift AND last ping within 5 minutes
- `alert` → last ping had `is_mock = true` (mock GPS)
- `warning` → last ping > 5 min but < 30 min old
- `offline` → last ping > 30 min old OR no pings

Query uses `location_pings` (admin can read via `pings_admin_read_tenant`) — pick the latest row per user_id in the tenant.

### `apps/mobile/src/screens/admin/TeamMapScreen.tsx`
- Uses `react-native-maps` (real map — only runs in dev build)
- One marker per team position, colored by status:
  - active = `#1565C0` (KAYA accent)
  - alert  = `#DC2626`
  - warning = `#CA8A04`
  - offline = `#94A3B8`
- Tap marker → bottom sheet with: avatar · name · status badge · last seen relative time · quick actions row (placeholders for "call" / "message")
- Also overlays the tenant's geofence circles (reuse pattern from `MapNativeScreen`)
- Realtime: subscribe to `location_pings` inserts; on any new ping in current tenant, refresh positions

### `apps/mobile/src/screens/admin/TeamMapFallbackScreen.tsx`
Expo Go fallback — list of team members with status badge, no map. Pattern from `MapFallbackScreen.tsx`.

## Files to modify

### `apps/mobile/app/(tabs)/map.tsx`
Today the dispatcher picks `MapFallbackScreen` vs `MapNativeScreen`. Extend it to also branch on role:
```tsx
import Constants from 'expo-constants'
import type { ComponentType } from 'react'
import { useMobileRole } from '@/src/hooks/use-mobile-role'

const isExpoGo = Constants.executionEnvironment === 'storeClient'

const adminNative = () => require('@/src/screens/admin/TeamMapScreen').default
const adminFallback = () => require('@/src/screens/admin/TeamMapFallbackScreen').default
const employeeNative = () => require('@/src/screens/employee/MapNativeScreen').default
const employeeFallback = () => require('@/src/screens/employee/MapFallbackScreen').default

export default function MapTab() {
  const role = useMobileRole()
  let Screen: ComponentType
  if (role === 'admin') {
    Screen = isExpoGo ? adminFallback() : adminNative()
  } else {
    Screen = isExpoGo ? employeeFallback() : employeeNative()
  }
  return <Screen />
}
```

The `require()` calls remain lazy (only the executed branch loads), so `react-native-maps` stays out of the Expo Go bundle's execution path.

## Acceptance criteria
- [ ] Logged in as admin in dev build → real map with team pins
- [ ] Logged in as admin in Expo Go → fallback list of team members
- [ ] Logged in as employee → existing employee map (unchanged)
- [ ] Status colors match spec (4 tones)
- [ ] Realtime: inserting a ping in Studio for a different user updates that user's pin without a manual refresh
- [ ] typecheck + format:check pass

## Commit
```powershell
git add apps/mobile/src/services/team-positions.ts apps/mobile/src/screens/admin/TeamMapScreen.tsx apps/mobile/src/screens/admin/TeamMapFallbackScreen.tsx apps/mobile/app/\(tabs\)/map.tsx
git commit -m "feat(mobile): add live team map for admin"
```

## DO NOT
- ❌ Import `react-native-maps` at the top of `map.tsx` — break the lazy-require pattern → Expo Go crashes
- ❌ Wire the quick-action buttons (call / message) to real actions — placeholders for v1
- ❌ Cache positions in MMKV — Phase 3 SDK has its own offline queue
