# task.044 — Approve provisional location (mobile admin)

**Type:** 🤖 Codex
**Phase:** 4 — Mobile Admin
**Depends on:** task.036 + migration 10 applied (provisional schema + approve/reject RPCs)
**Commit:** `feat(mobile): admin provisional approval flow`

---

## Read first
- `tasks/00_HANDOFF.md`
- `apps/web/components/locations/ProvisionalCard.tsx` (web parity — same fields + approve/reject)
- `apps/web/app/(app)/locations/pending/actions.ts` (server actions for the RPCs)
- `apps/mobile/src/screens/employee/MarkLocationScreen.tsx` (the upload flow that creates these submissions)
- Mockup: `tasks/reference/designs/24_admin_approve.png`

## Goal
Two screens on mobile so admins can review and approve/reject employee-submitted provisional locations on the go:

1. **Inbox screen** — list of pending submissions (replaces / complements the alerts tab; for v1 add a separate route reachable from the Admin Dashboard).
2. **Detail screen** — single submission with photo, employee, GPS, map preview, and Approve / Reject buttons.

## Files to add

### `apps/mobile/src/services/provisional-admin.ts`
```ts
interface PendingSubmission {
  id: string
  photoSignedUrl: string | null
  employeeName: string
  employeeInitials: string
  latitude: number
  longitude: number
  submittedAt: string | null
  distanceToNearestM: number | null
}

export async function fetchPendingSubmissions(): Promise<PendingSubmission[]>
export async function approveLocation(id: string, name: string): Promise<void>
export async function rejectLocation(id: string, reason: string): Promise<void>
```

Query mirrors `apps/web/app/(app)/locations/pending/page.tsx`. Use `supabase.storage.from('provisional-photos').createSignedUrl(path, 600)` to convert stored paths to viewable URLs. Approve/reject call the `approve_location` / `reject_location` RPCs.

### `apps/mobile/src/screens/admin/ApproveLocationInbox.tsx`
- FlatList of cards, each card:
  - Photo thumbnail (top, 4:3 ratio) using `Image` with `source={{ uri: signedUrl }}`
  - Employee initials avatar + name + submitted relative time
  - "→ განხილვა" button → pushes `/approve-location/[id]`
- Pull-to-refresh
- Empty state: "მოლოდინში მოთხოვნა არ არის"

### `apps/mobile/src/screens/admin/ApproveLocationDetail.tsx`
- Reads the `id` route param
- Fetches the single submission via `fetchPendingSubmissions` then filters (or add a singular fetch helper)
- Layout:
  - Large photo at top (square, full-bleed)
  - Employee card (avatar · name · email · submitted time)
  - GPS pill (`lat, lng` + "უახლოესი აქტიური: X მ" if computed server-side; for v1 just GPS)
  - Compact MapView preview centered on the pending pin (Expo Go fallback: skip map)
  - Three buttons:
    - **დამტკიცება** (green primary) → opens an inline form asking for final name + category, calls `approveLocation`
    - **ერთჯერად დაშვება** (gray secondary) → for v1 stub with `Alert.alert('მოგვიანებით')` (true single-use approval is out of scope)
    - **უარყოფა** (red destructive) → opens form asking for rejection reason, calls `rejectLocation`
- After success → `router.back()` and refresh the inbox

### `apps/mobile/app/approve-location/index.tsx`
Renders `<ApproveLocationInbox />`.

### `apps/mobile/app/approve-location/[id].tsx`
Renders `<ApproveLocationDetail />` with the `id` from `useLocalSearchParams()`.

## Files to modify

### `apps/mobile/app/_layout.tsx`
Register the new routes inside the `authedAndOnboarded` Stack.Protected block. The inbox can be modal; the detail can be a regular push.

### Entry point — Admin Dashboard or Alerts tab
Add a tile/banner on the dashboard that shows pending count and links to `/approve-location`. Acceptable to add it to the alerts tab instead.

## Acceptance criteria
- [ ] Submitting a provisional location from the employee `/mark` flow makes it appear in the inbox within seconds
- [ ] Photo loads via signed URL (no public bucket access)
- [ ] Approve → row becomes `status='active'`, name is set; row disappears from the inbox + appears in the main `/locations` list on web
- [ ] Reject → row becomes `status='rejected'` with `rejection_note` set
- [ ] Non-admin gets "მხოლოდ ადმინისთვის" message on both routes
- [ ] typecheck + format:check pass

## Commit
```powershell
git add apps/mobile/src/services/provisional-admin.ts apps/mobile/src/screens/admin apps/mobile/app/approve-location apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): admin provisional approval flow"
```

## DO NOT
- ❌ Make the provisional-photos bucket public — always use signed URLs
- ❌ Auto-pick a name from the employee's note without admin confirmation — admin must confirm
- ❌ Insert directly into `locations` from the client — go through `approve_location` / `reject_location` RPCs for the audit fields (`reviewed_by`, `reviewed_at`)
