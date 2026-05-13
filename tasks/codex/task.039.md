# task.039 — Team list screen (mobile admin)

**Type:** 🤖 Codex
**Phase:** 4 — Mobile Admin
**Depends on:** task.036, task.038 (reuses `fetchTeamPositions`)
**Commit:** `feat(mobile): add team list screen`

---

## Read first
- `tasks/00_HANDOFF.md`
- `apps/web/components/users/UsersTable.tsx` (similar concept on web — sectioned by status)
- `apps/mobile/src/services/team-positions.ts` (from task.038 — reuse if exists)
- Mockup: `tasks/reference/designs/08_admin_team.png`

## Goal
Replace the `admin-team.tsx` placeholder with a sectioned list of team members grouped by status (Active / Alert / Warning / Offline). Each row: avatar, name, current location, duration, status badge. Search bar on top.

Tapping a row opens a per-user detail (stub for v1 — just an Alert with the user's info — full detail screen is later).

## Files to add

### `apps/mobile/src/services/team-roster.ts`
```ts
interface TeamRosterMember {
  user_id: string
  name: string
  initials: string
  email: string
  status: 'active' | 'alert' | 'warning' | 'offline'
  current_location_name: string | null
  duration_label: string | null  // "1ს 23წ" if active, "გუშინ 18:42" if offline
}

export async function fetchTeamRoster(): Promise<TeamRosterMember[]>
```

Pulls from `tenant_memberships` joined to `users` and the latest `shifts` / `location_pings` for each member. Status rules reuse the same logic as `fetchTeamPositions` from task.038.

## Files to modify

### `apps/mobile/app/(tabs)/admin-team.tsx`
Replace placeholder with:
- SafeAreaView + ScrollView
- Title "გუნდი" + subtitle showing total active count
- Search bar (filters in-memory by name/email)
- SectionList with 4 sections, ordered: Active · Alert · Warning · Offline
- Section header: 11px uppercase tracking + count badge
- Each row tap → `Alert.alert(member.name, ...details)` for v1
- Pull-to-refresh

KAYA palette + tone colors:
- Active section header dot = `#16A34A`
- Alert = `#DC2626`
- Warning = `#CA8A04`
- Offline = `#94A3B8`

## Acceptance criteria
- [ ] All active tenant members appear in their correct section
- [ ] Empty state when no members (apart from the admin themselves)
- [ ] Search filters live as user types (debounce not required)
- [ ] Pull-to-refresh re-fetches
- [ ] typecheck + format:check pass

## Commit
```powershell
git add apps/mobile/src/services/team-roster.ts apps/mobile/app/\(tabs\)/admin-team.tsx
git commit -m "feat(mobile): add team list screen"
```

## DO NOT
- ❌ Build a full user-detail screen — `Alert.alert` placeholder is enough for v1
- ❌ Add deactivation / role-change actions here — that's a Phase 6 admin feature
- ❌ Query >1 ping per user with a separate request per user (N+1) — use a single batched query with `distinct on (user_id) order by recorded_at desc` or similar
