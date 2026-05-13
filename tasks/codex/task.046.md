# task.046 — Push notification deep linking (mobile)

**Type:** 🤖 Codex
**Phase:** 7 — Polish (post-Phase 3-Lite)
**Depends on:** task.040 + Phase 3-Lite (already shipped, commit 828d24c)
**Commit:** `feat(mobile): route push notifications to the right screen`

---

## Read first
- `tasks/00_HANDOFF.md`
- `apps/mobile/app/_layout.tsx` — RootLayout, where the listener mounts
- `supabase/functions/geofence-event/index.ts` — see the `data` payloads pushed:
  - `{ kind: 'shift_started', shift_id }`
  - `{ kind: 'shift_ended',   shift_id }`
  - `{ kind: 'approaching',   location_id }`
  - `{ kind: 'out_of_zone',   user_id, location_id }`
  - `{ kind: 'mock_gps',      user_id, location_id }`

## Goal
Tapping a push notification should open the app **and** navigate to a useful
screen. Today expo-notifications just opens the app to the last route, which
feels broken when an admin taps an "out of zone" alert.

## Files to add

### `apps/mobile/src/services/push-routing.ts`
```ts
import { router } from 'expo-router'

interface PushData {
  kind?: string
  shift_id?: string
  location_id?: string
  user_id?: string
}

/** Returns the path to navigate to, or null when the kind is unknown. */
export function routeForPushData(data: PushData | null | undefined): string | null {
  if (!data?.kind) return null
  switch (data.kind) {
    case 'shift_started':
    case 'shift_ended':
      return '/'                       // employee home — shows the current/last shift
    case 'approaching':
      return '/map'                    // employee map — see the location you're near
    case 'out_of_zone':
    case 'mock_gps':
      return '/admin-alerts'           // admin alerts inbox
    default:
      return null
  }
}

/** Side-effect helper for the listener — kept separate so it's unit-testable. */
export function navigateFromPush(data: PushData | null | undefined): void {
  const path = routeForPushData(data)
  if (path) router.push(path as never)
}
```

### `apps/mobile/src/hooks/use-push-routing.ts`
```ts
import { useEffect } from 'react'
import { navigateFromPush } from '@/src/services/push-routing'

export function usePushRouting(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const Notifications = require('expo-notifications') as typeof import('expo-notifications')

    // 1. Cold start — user tapped the push while the app was killed
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification?.request?.content?.data) {
        navigateFromPush(response.notification.request.content.data as never)
      }
    })

    // 2. Warm start — user tapped while the app was backgrounded
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateFromPush(response.notification.request.content.data as never)
    })

    return () => sub.remove()
  }, [enabled])
}
```

Use the same `isExpoGo` early-return pattern that `use-tracking-bootstrap.ts`
uses, so Expo Go doesn't crash on the lazy `expo-notifications` require.

## Files to modify

### `apps/mobile/app/_layout.tsx`
Wire `usePushRouting(authedAndOnboarded)` next to `useTrackingBootstrap`.

## Acceptance criteria
- [ ] Tapping "ცვლა დაიწყო" (received in-app or cold start) routes to `/`
- [ ] Tapping "სამუშაო ზონიდან გასვლა" routes to `/admin-alerts`
- [ ] Tapping a notification with an unknown `kind` does NOT navigate (no crash)
- [ ] Expo Go: hook is no-op (no static `expo-notifications` import)
- [ ] typecheck + format:check pass

## Commit
```powershell
git add apps/mobile/src/services/push-routing.ts apps/mobile/src/hooks/use-push-routing.ts apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): route push notifications to the right screen"
```

## DO NOT
- ❌ Add a static `import * as Notifications from 'expo-notifications'` — that crashes Expo Go (the same trap PermissionsScreen.tsx already hit in commit bcb604b)
- ❌ Use `router.replace` for these pushes — keep the back stack intact so the user can return to whatever they were doing
- ❌ Subscribe to the listener outside an effect (TaskManager / module-top is the wrong scope for navigation)
