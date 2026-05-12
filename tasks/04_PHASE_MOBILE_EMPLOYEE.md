# Phase 3 — Mobile Employee App (Week 7-10)

> **Goal:** Employee installs, logs in, shifts auto-track via background GPS.
> **Effort:** ~140 hours (longest phase — geofence complexity)
> **Prerequisites:** Phase 1 complete (mobile login working).

---

## 🎯 Overview

ეს ფაზაა ყველაზე რთული. **არ ააწყო ბრუნდი ჩექ ლისტის გვერდის ავლით.**

ბოლოს employee-ს უნდა შეეძლოს:
- ✅ Onboarding flow (permissions, battery whitelist)
- ✅ Background geolocation tracking enabled
- ✅ Auto SHIFT_START on Trigger Zone entry (with 30s hysteresis)
- ✅ Auto SHIFT_END on Trigger Zone exit (with 60s hysteresis)
- ✅ Push notifications (approaching, arrived, shift ended)
- ✅ Live navigation to next location
- ✅ Photo verification when needed
- ✅ Mark ad-hoc location (submission for admin approval)
- ✅ Mock GPS detection + blocking
- ✅ Offline mode (cache + sync)

---

## ⚠️ კრიტიკული Prerequisites

**ჯერ შეიძინე licenses-ი** ფაზის დაწყებამდე:
1. **transistorsoft react-native-background-geolocation** — $290 per platform = $580 total
   - iOS license: `react-native-background-geolocation.ios.license`
   - Android license: `react-native-background-geolocation.android.license`
2. **EAS Build** (optional) — $99/month if you don't want to build locally

**Move to bare workflow** ამ ფაზაში — managed Expo ვერ ემუშავება background location-ს:
```bash
cd apps/mobile
npx expo prebuild
```

ეს შექმნის `ios/` და `android/` დირექტორიებს.

---

## 📋 Tasks

### Task 3.1 — Onboarding Flow

**Goal:** First-launch wizard: permissions, battery whitelist, intro.

**Files to create:**
- `apps/mobile/src/screens/onboarding/WelcomeScreen.tsx`
- `apps/mobile/src/screens/onboarding/PermissionsScreen.tsx`
- `apps/mobile/src/screens/onboarding/BatteryScreen.tsx` (Android only)
- `apps/mobile/src/hooks/use-onboarding.ts`

**Implementation notes:**
- Show after first login, before main app
- Request location permission "When in Use" first
- Then "Always" (required for background geofencing)
- Android: link to battery optimization settings
- Mark complete in AsyncStorage

**Acceptance criteria:**
- [ ] Welcome screen explains why GPS needed (privacy-friendly tone)
- [ ] Permissions requested with system dialogs
- [ ] "Always" location explained before requesting
- [ ] Android battery whitelist explained + deep link to settings
- [ ] Skipping → degraded mode (manual check-in only)
- [ ] Re-shown if permissions revoked

**Commit:** `feat(mobile): add onboarding flow with permissions`

---

### Task 3.2 — Install Background Geolocation SDK

**Goal:** Wire up transistorsoft SDK with license.

**Files to create/modify:**
- `apps/mobile/src/services/location.ts`
- `apps/mobile/app.json` — license keys
- `ios/Podfile`, `android/app/build.gradle` (managed by SDK installer)

**Implementation:**

```bash
cd apps/mobile
pnpm add react-native-background-geolocation
pnpm add react-native-background-fetch  # required peer dep
npx pod-install  # iOS
```

Update `app.json`:
```json
{
  "expo": {
    "plugins": [
      ["react-native-background-geolocation", {
        "license": "YOUR_LICENSE_KEY",
        "ios": {
          "NSLocationAlwaysAndWhenInUseUsageDescription": "TrackPro აჩვენებს თქვენი ცვლის ლოკაციას ცვლის დროს",
          "NSLocationWhenInUseUsageDescription": "TrackPro აჩვენებს თქვენი ცვლის ლოკაციას",
          "UIBackgroundModes": ["location", "fetch"]
        }
      }]
    ]
  }
}
```

`apps/mobile/src/services/location.ts`:
```typescript
import BackgroundGeolocation from 'react-native-background-geolocation'

export async function initLocationService() {
  // Configure SDK
  const state = await BackgroundGeolocation.ready({
    // Geolocation Config
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
    distanceFilter: 10,

    // Activity Recognition
    stopTimeout: 5,

    // Application config
    debug: __DEV__,
    logLevel: __DEV__ ? BackgroundGeolocation.LOG_LEVEL_VERBOSE : BackgroundGeolocation.LOG_LEVEL_ERROR,
    stopOnTerminate: false,
    startOnBoot: true,

    // HTTP / SQLite config
    autoSync: true,
    batchSync: false,
    autoSyncThreshold: 5,

    // Geofence config
    geofenceProximityRadius: 2000,
    geofenceInitialTriggerEntry: true,
  })

  if (!state.enabled) {
    await BackgroundGeolocation.start()
  }
}

export async function registerGeofences(geofences: Array<{
  identifier: string
  latitude: number
  longitude: number
  radius: number
  notifyOnEntry: boolean
  notifyOnExit: boolean
  notifyOnDwell: boolean
  loiteringDelay: number
  extras?: Record<string, unknown>
}>) {
  await BackgroundGeolocation.addGeofences(geofences)
}

export async function removeAllGeofences() {
  await BackgroundGeolocation.removeGeofences()
}

export async function getCurrentPosition() {
  return BackgroundGeolocation.getCurrentPosition({
    samples: 3,
    persist: false,
    extras: { event: 'manual_request' },
  })
}
```

**Acceptance criteria:**
- [ ] SDK builds without errors on iOS + Android
- [ ] License key validates (check logs)
- [ ] `initLocationService()` runs on app launch
- [ ] Debug mode shows location events in console

**Commit:** `feat(mobile): integrate background geolocation sdk`

---

### Task 3.3 — Geofence State Machine (Server-Side Logic)

**Goal:** Supabase Edge Function processes geofence events with hysteresis.

**Files to create:**
- `supabase/functions/geofence-event/index.ts`

**References:**
- `reference/GEOFENCE_DESIGN_RULES.md` § Hysteresis

**Implementation:**

```typescript
// supabase/functions/geofence-event/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface GeofenceEventPayload {
  identifier: string  // location_id
  action: 'ENTER' | 'EXIT' | 'DWELL'
  location: {
    coords: { latitude: number; longitude: number; accuracy: number }
    timestamp: string
  }
  user_id: string
  zone_type: 'trigger' | 'boundary'
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const payload: GeofenceEventPayload = await req.json()

  // 1. Verify user from auth header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  // 2. Insert raw event
  await supabase.from('geofence_events').insert({
    user_id: payload.user_id,
    location_id: payload.identifier,
    action: payload.action,
    zone_type: payload.zone_type,
    lat: payload.location.coords.latitude,
    lng: payload.location.coords.longitude,
    accuracy_m: payload.location.coords.accuracy,
    occurred_at: payload.location.timestamp,
  })

  // 3. Apply hysteresis logic
  if (payload.zone_type === 'trigger') {
    if (payload.action === 'ENTER' || payload.action === 'DWELL') {
      // Check if user has open shift at this location
      const { data: openShift } = await supabase
        .from('shifts')
        .select('id')
        .eq('user_id', payload.user_id)
        .is('ended_at', null)
        .single()

      if (!openShift && payload.action === 'DWELL') {
        // DWELL = hysteresis passed → SHIFT_START
        await supabase.from('shifts').insert({
          user_id: payload.user_id,
          location_id: payload.identifier,
          started_at: payload.location.timestamp,
        })

        // Send push notification
        await sendPush(payload.user_id, 'მისულხართ — ცვლა დაიწყო')
      }
    } else if (payload.action === 'EXIT') {
      // Wait 60s before ending shift (hysteresis)
      // Use pg_cron or queue for this — simplified:
      // Set "exiting" state, schedule check in 60s
      await supabase.from('shifts')
        .update({ state: 'exiting', exit_started_at: payload.location.timestamp })
        .eq('user_id', payload.user_id)
        .is('ended_at', null)
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

async function sendPush(userId: string, message: string) {
  // Use Expo Push API
  // Implementation in Task 3.5
}
```

Deploy:
```bash
supabase functions deploy geofence-event
```

**Acceptance criteria:**
- [ ] Edge function deployed and callable
- [ ] Events logged to `geofence_events` table
- [ ] Hysteresis logic correct (30s entry, 60s exit)
- [ ] Open shift prevents duplicate SHIFT_START
- [ ] Tests with mock payloads pass

**Commit:** `feat(geofence): add edge function for event processing`

---

### Task 3.4 — Mobile Geofence Integration

**Goal:** Mobile SDK fires events → POST to Edge Function.

**Files to modify:**
- `apps/mobile/src/services/location.ts`
- `apps/mobile/src/services/geofence-sync.ts` (new)

**Implementation:**

```typescript
// apps/mobile/src/services/geofence-sync.ts
import BackgroundGeolocation from 'react-native-background-geolocation'
import { supabase } from './supabase'

export function setupGeofenceListeners() {
  BackgroundGeolocation.onGeofence(async (event) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Determine zone type from identifier suffix
    const zoneType = event.identifier.endsWith(':trigger') ? 'trigger' : 'boundary'
    const locationId = event.identifier.replace(/:(trigger|boundary)$/, '')

    await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/geofence-event`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: locationId,
        action: event.action,
        location: event.location,
        user_id: session.user.id,
        zone_type: zoneType,
      }),
    })
  })
}

export async function syncAssignedGeofences() {
  // 1. Fetch assigned locations from server
  const { data: locations } = await supabase
    .from('locations')
    .select('id, latitude, longitude, trigger_radius, boundary_radius')

  if (!locations) return

  // 2. Remove old geofences
  await BackgroundGeolocation.removeGeofences()

  // 3. Register new geofences (two per location: trigger + boundary)
  const geofences = locations.flatMap((loc) => [
    {
      identifier: `${loc.id}:trigger`,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radius: Math.max(loc.trigger_radius, 200), // Apple minimum
      notifyOnEntry: true,
      notifyOnExit: true,
      notifyOnDwell: true,
      loiteringDelay: 30000, // 30s hysteresis
    },
    {
      identifier: `${loc.id}:boundary`,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radius: loc.boundary_radius,
      notifyOnEntry: true,
      notifyOnExit: true,
      notifyOnDwell: false,
      loiteringDelay: 0,
    },
  ])

  await BackgroundGeolocation.addGeofences(geofences)
}
```

**Acceptance criteria:**
- [ ] Geofences registered on app launch after login
- [ ] Entering trigger zone → event POSTed to Edge Function
- [ ] DWELL event fires after 30s
- [ ] Both trigger AND boundary zones registered per location
- [ ] Realtime subscription re-syncs on location changes

**Commit:** `feat(mobile): connect geofence events to backend`

---

### Task 3.5 — Push Notifications

**Goal:** Backend sends push, mobile receives + handles.

**Files to create:**
- `apps/mobile/src/services/notifications.ts`
- Supabase migration: `device_tokens` table

**Implementation:**

SQL:
```sql
create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now()
);

alter table public.device_tokens enable row level security;
create policy "device_tokens_own" on public.device_tokens
  using (user_id = auth.uid());
```

`apps/mobile/src/services/notifications.ts`:
```typescript
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function registerPushToken() {
  if (!Device.isDevice) return

  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return

  const token = (await Notifications.getExpoPushTokenAsync()).data
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase.from('device_tokens').upsert({
      user_id: user.id,
      token,
      platform: Device.osName?.toLowerCase() === 'ios' ? 'ios' : 'android',
    }, { onConflict: 'token' })
  }
}
```

Update Edge Function (`geofence-event/index.ts`) — `sendPush` function:
```typescript
async function sendPush(userId: string, title: string, body: string) {
  const { data: tokens } = await supabase
    .from('device_tokens')
    .select('token')
    .eq('user_id', userId)

  if (!tokens?.length) return

  const messages = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    sound: 'default',
  }))

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  })
}
```

**Acceptance criteria:**
- [ ] Push token registered on login
- [ ] Entering trigger zone → push: "ახლოს ხართ — საქარის ფილ. #2"
- [ ] DWELL confirmed → push: "მისულხართ — ცვლა დაიწყო"
- [ ] Exit confirmed → push: "ცვლა დასრულდა — 8ს 36წ"
- [ ] Tapping push opens correct screen

**Commit:** `feat(mobile): add push notifications for geofence events`

---

### Task 3.6 — Home Screen (Employee)

**Goal:** Main screen showing current shift state.

**Files to create:**
- `apps/mobile/src/screens/employee/HomeScreen.tsx`
- `apps/mobile/src/hooks/use-current-shift.ts`

**References:**
- Mockup: `reference/designs/02_home_inactive.png`, `03_home_active.png`

**Acceptance criteria:**
- [ ] Inactive state: "ცვლის გარეთ" + big blue CTA
- [ ] Active state: KAYA blue hero + live timer (HH:MM:SS) + stats
- [ ] Current location card if inside geofence
- [ ] Realtime timer updates (1s interval)
- [ ] Realtime subscription to shift status

**Commit:** `feat(mobile): add home screen with active/inactive states`

---

### Task 3.7 — Map Screen

**Goal:** Full-screen map showing geofences + user location.

**Files to create:**
- `apps/mobile/src/screens/employee/MapScreen.tsx`

**References:**
- Mockup: `reference/designs/04_map.png`

**Implementation:**
- Use `react-native-maps` with Google Maps provider
- Show assigned geofences as circles (Trigger blue, Boundary amber)
- Current user pin (blue dot with halo)
- Recenter button
- Tap geofence → location detail bottom sheet

**Acceptance criteria:**
- [ ] Map renders correctly
- [ ] All assigned geofences visible
- [ ] Current location updates in real-time
- [ ] Bottom sheet on geofence tap

**Commit:** `feat(mobile): add map screen with geofences`

---

### Task 3.8 — History Screen

**Goal:** List of past shifts with stats.

**Files to create:**
- `apps/mobile/src/screens/employee/HistoryScreen.tsx`

**References:**
- Mockup: `reference/designs/05_history.png`

**Acceptance criteria:**
- [ ] Day/Week/Month tabs
- [ ] Hero card with totals
- [ ] Shift list (location, duration, distance)
- [ ] Pull-to-refresh
- [ ] Infinite scroll for older shifts

**Commit:** `feat(mobile): add history screen with shift list`

---

### Task 3.9 — Live Navigation

**Goal:** Navigate to next assigned location.

**Files to create:**
- `apps/mobile/src/screens/employee/NavigationScreen.tsx`
- `apps/mobile/src/services/routing.ts`

**References:**
- Mockup: `reference/designs/17_navigation.png`, `18_approaching.png`

**Implementation:**
- Use Mapbox Directions API for route
- Show big blue route line on map
- Approaching state (200m away) → pulse rings
- ETA + distance + speed displayed
- Auto-transitions to "Arrived" screen on geofence entry

**Acceptance criteria:**
- [ ] Route line renders from current to destination
- [ ] ETA updates as you move
- [ ] Approaching banner appears at 200m
- [ ] Smooth transition to arrived state

**Commit:** `feat(mobile): add live navigation with routing`

---

### Task 3.10 — Approaching + Arrived States

**Goal:** UI states between navigation and shift active.

**Files to create:**
- `apps/mobile/src/screens/employee/ApproachingScreen.tsx`
- `apps/mobile/src/screens/employee/ArrivedScreen.tsx`

**References:**
- Mockups: `18_approaching.png`, `19_arrived.png`, `25_hysteresis.png`

**Acceptance criteria:**
- [ ] Approaching screen: pulse rings, "ახლოს ხართ · 120 მ"
- [ ] Hysteresis screen: green progress bar "24წ / 30წ · 80%"
- [ ] Arrived screen: KAYA blue hero, big timer
- [ ] Auto-transitions based on backend state

**Commit:** `feat(mobile): add approaching and arrived state screens`

---

### Task 3.11 — Mark Ad-Hoc Location

**Goal:** Employee photographs new location → submits for admin approval.

**Files to create:**
- `apps/mobile/src/screens/employee/MarkLocationCamera.tsx`
- `apps/mobile/src/screens/employee/MarkLocationForm.tsx`
- `apps/mobile/src/services/photo-upload.ts`

**References:**
- Mockups: `22_mark_camera.png`, `23_mark_form.png`

**Implementation:**
- Use `expo-camera` for photo capture
- Extract GPS from current device position at capture moment
- Upload photo to Supabase Storage
- Insert provisional location (status: `pending_approval`)
- Show toast: "გადააგზავნე ადმინს"

**Acceptance criteria:**
- [ ] Camera viewfinder with GPS overlay
- [ ] Photo captures + GPS embedded as metadata
- [ ] Form: name, description, category
- [ ] Submit creates provisional location
- [ ] Admin gets push: "გიორგიმ მონიშნა ლოკაცია"

**Commit:** `feat(mobile): add ad-hoc location marking with photo`

---

### Task 3.12 — Mock GPS Detection

**Goal:** Block check-in if mock GPS detected.

**Files to modify:**
- `apps/mobile/src/services/location.ts`
- `apps/mobile/src/screens/employee/HomeScreen.tsx`

**References:**
- Mockup: `26_mock_gps_block.png`
- Rules: `reference/GEOFENCE_DESIGN_RULES.md` § Mock GPS

**Implementation:**

```typescript
// In location.ts
BackgroundGeolocation.onLocation(async (location) => {
  if (location.mock || location.isFromMockProvider) {
    // Block check-in, alert admin
    await fetch(`${SUPABASE_URL}/functions/v1/mock-gps-alert`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ user_id: userId, lat: location.coords.latitude, lng: location.coords.longitude }),
    })
    // Show blocking UI
    EventEmitter.emit('mock-gps-detected')
  }
})
```

**Acceptance criteria:**
- [ ] Mock GPS detection works on iOS + Android
- [ ] Red blocking card shown on home screen
- [ ] Admin alert sent
- [ ] User can call admin via deep link

**Commit:** `feat(mobile): add mock gps detection with blocking ui`

---

### Task 3.13 — Offline Mode

**Goal:** Cache events locally, sync when online.

**Implementation:**
- transistorsoft SDK has built-in SQLite + auto-sync
- Already configured in Task 3.2 (`autoSync: true`)
- Test by enabling airplane mode → moving → re-enabling

**Acceptance criteria:**
- [ ] Events queued locally when offline
- [ ] Auto-sync on reconnect
- [ ] No data loss after airplane mode test
- [ ] UI shows "offline" indicator when no network

**Commit:** `feat(mobile): add offline mode indicator`

---

## ✅ Phase 3 Complete Checklist

- [ ] Onboarding flow guides through permissions
- [ ] Background geolocation tracks reliably (test 24h)
- [ ] Geofence events trigger shift start/end with hysteresis
- [ ] Push notifications received on lock screen
- [ ] All employee screens (home, map, history, navigation) work
- [ ] Mark ad-hoc location flow complete
- [ ] Mock GPS detection blocks check-in
- [ ] Offline mode + sync works
- [ ] Tested on real iPhone + real Android phone (not just emulator)
- [ ] Battery drain acceptable (<10% per 8h shift)

**🎉 Move to Phase 4: `05_PHASE_MOBILE_ADMIN.md`**
