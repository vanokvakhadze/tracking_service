# task.036 — Role-based tab bar (admin vs employee)

**Type:** 🤖 Codex
**Phase:** 4 — Mobile Admin
**Depends on:** task.035 + Phase 3 SDK-free tasks (already in repo as of `e022734`)
**Commit:** `feat(mobile): add role-based tab bar`

---

## Read first
- `tasks/00_AI_AGENT_RULES.md`
- `tasks/00_CONVENTIONS.md`
- `tasks/00_HANDOFF.md` (status snapshot)
- `apps/mobile/app/(tabs)/_layout.tsx` (current employee-only tabs)
- `apps/mobile/src/hooks/use-current-shift.ts` (pattern for hooks that pull supabase data)

## Goal
Mobile currently shows the same 4 tabs to every user: Home / Map / History / Profile. Admin users (`tenant_admin`, `super_admin`) should instead see: Dashboard / Map / Team / Alerts.

This task only adds:
1. A `useMobileRole()` hook that returns 'admin' | 'employee'.
2. Empty placeholder screens for the 4 admin tabs.
3. `(tabs)/_layout.tsx` renders different `Tabs.Screen` declarations + hides the wrong set via `href: null`.

Each placeholder shows a one-line "Phase 4 Task X.Y" message — content lands in tasks 037-044.

## Files to add

### `apps/mobile/src/hooks/use-mobile-role.ts`
```ts
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/src/services/auth'

export type MobileRole = 'admin' | 'employee' | null

export function useMobileRole(): MobileRole {
  const [role, setRole] = useState<MobileRole>(null)

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user) {
        setRole(null)
        return
      }
      const memberships = (user.memberships ?? []) as Array<{
        is_active: boolean | null
        role: string | null
      }>
      const active = memberships.find((m) => m.is_active)
      const isAdmin =
        active?.role === 'tenant_admin' || active?.role === 'super_admin'
      setRole(isAdmin ? 'admin' : 'employee')
    })
  }, [])

  return role
}
```

### `apps/mobile/app/(tabs)/admin-dashboard.tsx`
```tsx
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function AdminDashboard() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.center}>
        <Text style={styles.title}>დაშბორდი</Text>
        <Text style={styles.muted}>Phase 4 Task 4.2 — Admin Dashboard placeholder</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  muted: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
})
```

### `apps/mobile/app/(tabs)/admin-team.tsx`
Mirror of `admin-dashboard.tsx` with title `"გუნდი"` and message `"Phase 4 Task 4.4 — Team List placeholder"`.

### `apps/mobile/app/(tabs)/admin-alerts.tsx`
Mirror with title `"ალერტი"` and `"Phase 4 Task 4.5 — Alerts Inbox placeholder"`.

## Files to modify

### `apps/mobile/app/(tabs)/_layout.tsx`
Replace the body so it reads `useMobileRole()` and conditionally renders two sets of `Tabs.Screen` declarations.

```tsx
import { Feather } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { useMobileRole } from '@/src/hooks/use-mobile-role'

const KAYA_ACCENT = '#1565C0'
const KAYA_TEXT_TERTIARY = '#94A3B8'

export default function TabLayout() {
  const role = useMobileRole()
  const isAdmin = role === 'admin'

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: KAYA_ACCENT,
        tabBarInactiveTintColor: KAYA_TEXT_TERTIARY,
        headerShown: false,
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E2E8F0' },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      {/* Employee tabs (shown for non-admin) */}
      <Tabs.Screen
        name="index"
        options={{
          href: isAdmin ? null : '/',
          title: 'მთავარი',
          tabBarIcon: ({ color }) => <Feather name="home" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: isAdmin ? null : '/history',
          title: 'ისტორია',
          tabBarIcon: ({ color }) => <Feather name="clock" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: isAdmin ? null : '/profile',
          title: 'პროფილი',
          tabBarIcon: ({ color }) => <Feather name="user" color={color} size={22} />,
        }}
      />

      {/* Admin tabs (shown only for admin) */}
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          href: isAdmin ? '/admin-dashboard' : null,
          title: 'დაშბორდი',
          tabBarIcon: ({ color }) => <Feather name="grid" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="admin-team"
        options={{
          href: isAdmin ? '/admin-team' : null,
          title: 'გუნდი',
          tabBarIcon: ({ color }) => <Feather name="users" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="admin-alerts"
        options={{
          href: isAdmin ? '/admin-alerts' : null,
          title: 'ალერტი',
          tabBarIcon: ({ color }) => <Feather name="alert-triangle" color={color} size={22} />,
        }}
      />

      {/* Map tab — visible to both, but the screen itself will branch by role
          in task 4.3 once admin team map lands. Keep visible for everyone. */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'რუკა',
          tabBarIcon: ({ color }) => <Feather name="map" color={color} size={22} />,
        }}
      />

      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  )
}
```

## Commands
```powershell
pnpm --filter @trackpro/mobile exec tsc --noEmit
pnpm format
```

## Acceptance criteria
- [ ] `useMobileRole()` returns `'admin'` for tenant_admin/super_admin members, `'employee'` otherwise
- [ ] When logged in as admin, tab bar shows: Dashboard · რუკა · გუნდი · ალერტი (4 tabs)
- [ ] When logged in as employee, tab bar shows: მთავარი · რუკა · ისტორია · პროფილი (4 tabs)
- [ ] Switching accounts (logout → login as different role) updates the tab bar after restart (re-render not required for v1)
- [ ] Placeholder screens render their "Phase 4 Task X.Y placeholder" text
- [ ] typecheck + format:check pass

## Commit
```powershell
git add apps/mobile/src/hooks/use-mobile-role.ts apps/mobile/app/\(tabs\)/admin-dashboard.tsx apps/mobile/app/\(tabs\)/admin-team.tsx apps/mobile/app/\(tabs\)/admin-alerts.tsx apps/mobile/app/\(tabs\)/_layout.tsx
git commit -m "feat(mobile): add role-based tab bar"
```

## DO NOT
- ❌ Implement the screens' real content — that's tasks 037-044
- ❌ Replace the existing employee tabs (`index`, `history`, `profile`) — just hide them via `href: null` when admin
- ❌ Add a new migration — the role check uses existing tenant_memberships data via getCurrentUser
