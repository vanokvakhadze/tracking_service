# task.057 — Users v2 rebuild — feature-rich table

**Type:** 🤖 Codex
**Phase:** 8 — Post-MVP polish (design alignment)
**Depends on:** task.054 Sparkline component (or build it inline here)
**Commit:** `feat(web): users v2 rebuild — stats + invite banner + bulk select + sparklines`

---

## Read first
- `design_system/Users v2.html` (347 lines) — **source of truth**
- `design_system/_shared.css` — design tokens
- `apps/web/app/(app)/users/page.tsx` — current server component
- `apps/web/components/users/UsersPageClient.tsx` + `UsersTable.tsx` (will be substantially rewritten)
- `apps/web/components/users/InviteUserDialog.tsx` (keep)
- `apps/web/components/users/BulkInviteDialog.tsx` (keep)
- `apps/web/app/(app)/users/invite-action.ts` + `bulk-invite-action.ts` (no changes)

## Goal
The current `/users` is a 6-column basic table. The v2 mockup is a 9-column feature-
rich table with bulk actions, productivity sparklines, and a pending-invitations
panel below.

```
1. Sub-header — title + count subtitle + (existing) CSV import / invite buttons
2. Stat strip — 4 KPI cards (total / active / avg productivity / pending invites)
3. Invite banner — gradient blue card with bulk-invite CTA
4. Filter row — 4 status chips + search input + Filter/Group buttons
5. Bulk action bar (hidden by default) — appears when ≥1 row selected
6. Users table — 9 columns including productivity bar + 7-day sparkline
7. Pending invitations card — 1 active + recent expired
```

## Files to add (`apps/web/components/users/`)

### `UserStatStrip.tsx` (new, server)
4 cards:
- Total users (count from `tenant_memberships`)
- Active (count where `is_active=true`)
- Avg productivity (avg score across all active users — same formula as task.055 leaderboard, 0 if no data)
- Pending invitations (count from `invitations` table)

### `InviteBanner.tsx` (new, client)
Gradient `var(--color-accent)` → `var(--color-accent-soft)` background, white text.
Content:
- Title "გააფართოვე გუნდი"
- Sub-line: "1 თვის უფასო trial · 5 invite-ი ერთად — CSV-ით"
- Two buttons: "გადახედე ნიმუშს" (downloads CSV template — wire to existing `BulkInviteDialog`'s template), "მოწვევა" (opens `InviteUserDialog`)

### `StatusChips.tsx` (new, client)
Replaces the current `FilterPill` row. 4 chips: ყველა · {n}, აქტიური · {n},
გათიშული · {n}, მოლოდინში · {n}. Active chip in `var(--color-accent)`.

### `UsersTableV2.tsx` (new, client — replaces `UsersTable.tsx`)
9-column table:
1. **Checkbox** — for bulk selection (`useState` array of selected user IDs)
2. **თანამშრომელი** — avatar + name + email
3. **გუნდი** — derive from `tenant_memberships.team_name` if exists; else "—"
4. **როლი** — role pill (admin / manager / user)
5. **სტატუსი** — colored dot + text (active / inactive / pending)
6. **ვიზიტი 7დ** — count from `geofence_events` last 7 days (group-by user_id query)
7. **პროდუქტიულობა** — score + horizontal bar (colored by range: <50 danger, 50–75 warning, ≥75 success)
8. **აქტივობა** — sparkline (7-day visit counts via `<Sparkline />`)
9. **მოქმედება** — hover-revealed: call icon, edit icon, kebab menu

Sortable headers: visits / productivity / activity (last-active). `aria-sort`
attributes on `<th>`.

### `BulkActionBar.tsx` (new, client)
Appears when `selectedIds.length > 0`:
- Left: select-all checkbox + "{n} მონიშნული"
- Right: 3 buttons — "Assign to team", "Set shift", "Deactivate"
- For v1, **Assign + Set shift can open a not-yet-built dialog showing 'მალე გამოვა'**. Only "Deactivate" needs to be wired (call a server action to set `tenant_memberships.is_active = false` for all selected rows).

### `PendingInvitationsCard.tsx` (new, server)
Below the table. Lists rows from `invitations` table where `accepted_at IS NULL`.
- Active invites (not expired): show "Resend" + "Cancel" buttons
- Expired: show "Resend" button (greyed-out badge)
- Empty state: "მოლოდინში მოწვევა არ არის"

### `users/deactivate-bulk-action.ts` (new server action)
Takes array of `tenant_membership_id` UUIDs. Marks `is_active = false`. RLS already
restricts to tenant admins via existing policy — verify with one tenant per row.

### Modify `UsersPageClient.tsx`
Rewire to use the new components. Layout:
```tsx
<SubHeader title="მომხმარებლები" subtitle="..." actions={...} />
<main className="p-6 space-y-6">
  <UserStatStrip ... />
  <InviteBanner onCsv={...} onInvite={...} />
  <div className="flex items-center justify-between">
    <StatusChips ... />
    <input search />
  </div>
  <BulkActionBar selectedIds={...} />
  <UsersTableV2 ... />
  <PendingInvitationsCard ... />
</main>
```

### Delete
- `UsersTable.tsx` — replaced by `UsersTableV2.tsx`
- `FilterPill` (if standalone) — replaced by `StatusChips`

## Acceptance criteria
- [ ] Stat strip renders 4 KPI cards
- [ ] InviteBanner gradient card renders + buttons wire to existing dialogs
- [ ] StatusChips replaces old FilterPill row with 4 chips + counts
- [ ] UsersTableV2 has 9 columns including checkbox + productivity bar + sparkline
- [ ] Sortable headers work for visits / productivity / activity columns
- [ ] BulkActionBar appears when any row is selected; "Deactivate" works end-to-end
- [ ] PendingInvitationsCard renders below table with active + expired invites
- [ ] All KAYA tokens — banner gradient via `var(--color-accent)` only
- [ ] Existing single-invite + CSV-invite flows unchanged
- [ ] typecheck + build pass

## DO NOT
- ❌ Build "Assign to team" / "Set shift" dialogs — stub with "მალე გამოვა" notice
- ❌ Touch invite-action.ts / bulk-invite-action.ts — those are stable
- ❌ Use a table library (TanStack / react-table) — pure HTML table is enough at this scale
- ❌ Add a new `invitations` schema — table already exists from earlier migrations

## Commit
```powershell
git add apps/web/components/users apps/web/app/'(app)'/users
git commit -m "feat(web): users v2 rebuild — stats + invite banner + bulk select + sparklines"
```

## Estimated effort
**~30-40 hours** of Codex work.
