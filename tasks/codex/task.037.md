# task.037 — Admin Dashboard screen (mobile)

**Type:** 🤖 Codex
**Phase:** 4 — Mobile Admin
**Depends on:** task.036
**Commit:** `feat(mobile): add admin dashboard`

---

## Read first
- `tasks/00_HANDOFF.md`
- `apps/mobile/app/(tabs)/index.tsx` (employee Home — KAYA hero / stat card patterns)
- `apps/web/app/(app)/dashboard/page.tsx` (parallel web admin dashboard)
- Mockup: `tasks/reference/designs/06_admin_dashboard.png`

## Goal
Replace the `admin-dashboard.tsx` placeholder with a real screen that shows tenant-wide live state for an admin's phone view:
- Hero card: "X / Y active" (count of currently-active shifts vs total members)
- Live shift list — scrollable, one row per ongoing shift
- Pull-to-refresh
- Realtime updates when shifts change (supabase channel)

If no shifts are active yet, show an empty state explaining Phase 3 SDK will populate this.

## Files to add

### `apps/mobile/src/services/admin-dashboard.ts`
Provides `fetchAdminSnapshot()` that returns:
```ts
interface AdminSnapshot {
  activeShifts: Array<{
    id: string
    user_first_name: string | null
    user_last_name: string | null
    user_email: string
    user_id: string
    started_at: string
    location_name: string | null
  }>
  totalMembers: number
}
```

Query plan:
1. Resolve current tenant via `getCurrentUser()` → `memberships[active].tenant.id`
2. `supabase.from('tenant_memberships').select('user_id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_active', true)` → totalMembers
3. `supabase.from('shifts').select('id, started_at, user_id, user:users(first_name, last_name, email), location:locations(name)').eq('tenant_id', tenantId).eq('status', 'active').order('started_at', { ascending: false })` → activeShifts

Admin can read all tenant shifts thanks to `shifts_admin_read_tenant` (migration 08) and `users_admin_read_tenant` (migration 06).

### `apps/mobile/src/hooks/use-admin-snapshot.ts`
- Calls `fetchAdminSnapshot()` on mount
- Subscribes to `shifts` realtime; on any change → re-fetch
- Returns `{ snapshot, loading, refresh }`

## Files to modify

### `apps/mobile/app/(tabs)/admin-dashboard.tsx`
Replace placeholder with:
- KAYA blue hero card: `${activeShifts.length} / ${totalMembers} active`
- Subtitle: today's date in `ka-GE` long format
- Live shift list (FlatList with `RefreshControl`):
  - Row per shift: initials avatar (multi-tone by user.id hash) · name · location · elapsed `HHsMMm`
- Empty state when 0 active shifts: "ცვლები არ მიმდინარეობს. Phase 3 SDK-ის ჩართვის შემდეგ აქ გამოჩნდება ცოცხალი მონაცემები."

Use the same KAYA constants pattern from `(tabs)/index.tsx`. No mock data — render real query result even if empty.

## Acceptance criteria
- [ ] Hero card shows correct counts (zeros if no active shifts; both numbers from real DB)
- [ ] Each row shows the employee's display name + location + elapsed time
- [ ] Pull-to-refresh re-runs the query
- [ ] Inserting an `active` shift row in Supabase Studio surfaces it in the list within ~2 seconds (realtime)
- [ ] typecheck + format:check pass

## Commit
```powershell
git add apps/mobile/src/services/admin-dashboard.ts apps/mobile/src/hooks/use-admin-snapshot.ts apps/mobile/app/\(tabs\)/admin-dashboard.tsx
git commit -m "feat(mobile): add admin dashboard"
```

## DO NOT
- ❌ Add a chart library — keep it text + list for v1
- ❌ Show data for tenants the user isn't an admin of — RLS guarantees that already; don't override
- ❌ Hard-code member count — query it from DB
