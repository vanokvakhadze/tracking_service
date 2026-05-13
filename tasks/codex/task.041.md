# task.041 — Admin create location: map step (mobile)

**Type:** 🤖 Codex
**Phase:** 4 — Mobile Admin
**Depends on:** task.036
**Commit:** `feat(mobile): admin location create — map step`

---

## Read first
- `tasks/00_HANDOFF.md` — § Critical pitfalls #3 (Expo Go map fallback)
- `apps/web/components/locations/LocationCreateForm.tsx` (web equivalent — for parity)
- `apps/mobile/src/screens/employee/MapNativeScreen.tsx` (lazy-require + KAYA map config)
- Mockup: `tasks/reference/designs/28_admin_create_map.png`

## Goal
Build the **first step** of the admin's location-creation flow: pick the position on the map. This is admin-only (not the employee provisional submission, which already exists in `MarkLocationScreen.tsx` at `/mark`).

Two modes (tab switcher at the top): "რუკაზე" (map mode — draggable pin) and "მისამართით" (address search via Mapbox Geocoding API).

Tap **გავაგრძელო** → navigates to `/admin-location-form` (task.042) with the picked lat/lng + address in route params.

> Expo Go fallback: same dispatcher pattern as `(tabs)/map.tsx`. Real map only in dev build; in Expo Go show a "ეს ფიჩერი მხოლოდ dev build-ში მუშაობს" notice + an option to enter lat/lng manually.

## Files to add

### `apps/mobile/src/screens/admin/CreateLocationMapScreen.tsx`
- Tab switcher (map / address)
- `MapView` with draggable marker + radius circle around it (use a small Trigger ring 100m placeholder; final radii are set in task.042 / 4.7)
- Address search input that calls Mapbox Geocoding (`https://api.mapbox.com/geocoding/v5/mapbox.places/{q}.json?access_token={EXPO_PUBLIC_MAPBOX_TOKEN}&language=ka&country=ge`); result rows update pin + form
- `გავაგრძელო` button: `router.push({ pathname: '/admin-location-form', params: { lat, lng, address } })`

### `apps/mobile/src/screens/admin/CreateLocationMapFallbackScreen.tsx`
Expo Go fallback. Two numeric inputs (lat / lng) + address text input + "გავაგრძელო". Friendly notice that the real map needs a dev build.

### `apps/mobile/app/admin-create-location.tsx`
Route shim:
```tsx
import Constants from 'expo-constants'

const isExpoGo = Constants.executionEnvironment === 'storeClient'

const Screen = isExpoGo
  ? require('@/src/screens/admin/CreateLocationMapFallbackScreen').default
  : require('@/src/screens/admin/CreateLocationMapScreen').default

export default Screen
```

## Files to modify

### `apps/mobile/app/_layout.tsx`
Register the two new routes (`admin-create-location`, `admin-location-form`) inside the `authedAndOnboarded` Stack.Protected block. Use `presentation: 'modal'` for both.

### Entry point — Admin Dashboard (`app/(tabs)/admin-dashboard.tsx`)
Add a "+ ლოკაცია" header button (top-right of the screen) that pushes `/admin-create-location`. If task 4.2 (dashboard content) hasn't landed yet, add the button to a minimal placeholder still — but keep the route registered.

## Acceptance criteria
- [ ] Admin-only — non-admin opening the route gets a "მხოლოდ ადმინისთვის" notice
- [ ] Map mode: dragging the pin updates the form lat/lng
- [ ] Address mode: result tap moves the pin + auto-fills address
- [ ] Continue button passes lat/lng + address to the next route via `router.push` params
- [ ] Expo Go fallback works (no react-native-maps in bundle execution)
- [ ] typecheck + format:check pass

## Commit
```powershell
git add apps/mobile/src/screens/admin apps/mobile/app/admin-create-location.tsx apps/mobile/app/\(tabs\)/admin-dashboard.tsx apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): admin location create — map step"
```

## DO NOT
- ❌ Insert into `locations` here — that happens in task.042 after the form is filled
- ❌ Reuse `MarkLocationScreen` — that is the employee provisional flow (status='pending_approval'). Admin path uses `create_location` RPC with status='active'.
- ❌ Add a category select on this screen — that belongs to the form step
