# task.053 — /alerts page redesign + KAYA polish

**Type:** 🤖 Codex
**Phase:** 8 — Post-MVP polish
**Depends on:** none (current `/alerts` works but doesn't match the design language)
**Commit:** `feat(web): /alerts redesign — KAYA tokens + filter tabs + density`

---

## Read first
- `tasks/reference/designs/09_admin_alerts.png` — the mobile mockup. The web design language must follow the same visual logic: severity-coloured cards with icon + name + time + action.
- `tasks/reference/DESIGN_RULES.md` — KAYA design system tokens, especially the **Badge / Pill**, **Card**, and **status colors** sections
- `design_system/Live Map v2.html` — for the sub-header pattern + filter chip pattern (lines 142–145)
- `apps/web/app/(app)/alerts/page.tsx` — current implementation (will be rewritten)
- `supabase/migrations/20260513000003_admin_alerts_rpc.sql` — `get_admin_alerts` RPC + the four `kind` values (`mock_gps` / `location_disabled` / `low_battery` / `out_of_zone`)

## Goal
The current `/alerts` page renders alerts in a generic list. The mobile mockup
(`09_admin_alerts.png`) shows the visual pattern we want: each alert is a card whose
**entire background is tinted by severity** (red-50 for critical, amber-50 for warning),
with an icon tile on the left, title + name + timestamp in the middle, and a primary
action button on the bottom for critical alerts ("ნახე დეტალები").

The web should follow the same pattern, plus filter chips above the list to let admin
focus on one kind at a time.

```
┌─────────────────────────────────────────────────────────────┐
│ Sub-header                                                  │
│ ალერტი    3 აქტიური · 12 დღევანდელი    [მონიშნე ნანახად]   │
├─────────────────────────────────────────────────────────────┤
│ Filter chips:                                               │
│ [ყველა · 3] [Mock GPS · 1] [ბატარეა · 1] [ლოკაცია · 1]      │
├─────────────────────────────────────────────────────────────┤
│ Pending locations summary (if count > 0):                  │
│ [📍] N ლოკაცია მოლოდინში     → /locations/pending           │
├─────────────────────────────────────────────────────────────┤
│ Critical (count)                                            │
│   ┌─ red-tinted card ──────────────────────────────────┐   │
│   │ [🛡️] Mock GPS — ცრუ ლოკაცია                       │   │
│   │      დათო ალადაშვილი · საქარის ფილ. #2             │   │
│   │      14:24 · 8 წუთის წინ                           │   │
│   │      [ნახე დეტალები]                               │   │
│   └────────────────────────────────────────────────────┘   │
│                                                             │
│ Warning (count)                                             │
│   ┌─ amber-tinted card ─────────────────────────────────┐  │
│   │ [🔋] დაბალი ბატარეა — 8%                            │  │
│   │      აქაკი ხუბუნაია                                  │  │
│   │      14:12 · 20 წუთის წინ                           │  │
│   └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Files to modify

### `apps/web/app/(app)/alerts/page.tsx`
Keep the SSR call to `get_admin_alerts` RPC. Add:
- `seen` query param support: when admin clicks "მონიშნე ნანახად" it stores `lastSeenAlertsAt` in localStorage and visually fades older alerts (no DB change; lowest-friction implementation).
- Filter chips state — client component receives all rows and slices by filter.

Pass alerts to a new `<AlertsList />` client component (so we can keep filter state local).

### `apps/web/components/alerts/AlertsList.tsx` (new)
Client component. Props: `{ alerts: AdminAlert[]; pendingLocationsCount: number }`.

State:
- `filter`: `'all' | 'mock_gps' | 'location_disabled' | 'low_battery' | 'out_of_zone'`
- `lastSeenAt`: stored in localStorage, used to dim older entries

Renders:
- Pending-locations card (only if `pendingLocationsCount > 0`) — `Link` to `/locations/pending`
- Filter chip row — uses the same chip pattern as `Live Map v2.html` lines 142–145, but with token colours
- Critical section (count chip + cards)
- Warning section (count chip + cards)

### `apps/web/components/alerts/AlertCard.tsx` (new)
Single alert card. Props: `{ alert: AdminAlert; dim: boolean }`.

Layout:
- Background: `var(--color-error-bg)` for `severity='critical'`, `var(--color-warning-bg)` for `'warning'`
- Border: `1px solid var(--color-error-border)` / `--color-warning-border`
- Icon tile (40×40, rounded 8px): tinted background, severity-coloured icon
- Title (14px / 600), kind label in the `ALERT_LABELS` map
- Subtitle (12px / secondary): user name · context (location name for `out_of_zone`, battery% for `low_battery`, accuracy for `mock_gps`)
- Timestamp (11px / tertiary)
- Bottom action button — only render for `severity='critical'`. Text: "ნახე დეტალები". For v1: link to `/users` (admin can find user) OR `#` no-op disabled link. Don't block on the actual deep-link target.

Use lucide icons:
- `mock_gps` → `ShieldAlert`
- `location_disabled` → `MapPinOff`
- `low_battery` → `BatteryLow`
- `out_of_zone` → `AlertTriangle`

### `apps/web/components/alerts/MarkSeenButton.tsx` (new)
Tiny client component button in the sub-header `actions` slot. Writes `Date.now()` to
`localStorage['trackpro:alerts:last_seen']` then `router.refresh()`s.

## Acceptance criteria
- [ ] Card backgrounds match severity (red-50 / amber-50)
- [ ] Filter chips work — clicking "ბატარეა" hides everything except `low_battery` alerts
- [ ] Pending-locations card only renders when `pendingLocationsCount > 0`, and links to `/locations/pending`
- [ ] Empty state per filter: "ამ კატეგორიაში ალერტი არ არის"
- [ ] "მონიშნე ნანახად" button dims alerts older than the saved timestamp (opacity 0.55)
- [ ] All colours via `var(--color-*)` tokens — no hardcoded hex
- [ ] All radii: button 4px, card 8px (per `DESIGN_RULES.md`)
- [ ] Sidebar badge keeps showing `pendingLocationsCount` on "ალერტი" entry (current behavior — don't break it)
- [ ] typecheck + build pass

## DO NOT
- ❌ Persist `lastSeenAt` to the database — localStorage is the right scope (per-admin per-browser)
- ❌ Add toast notifications when new alerts arrive — that's a separate task. Just re-fetch on `router.refresh()` or initial load.
- ❌ Add a new RPC — `get_admin_alerts` already returns everything we need
- ❌ Subscribe to Realtime for alerts — the mobile inbox doesn't, and admin will refresh the page when checking. Save the channel quota.

## Commit
```powershell
git add apps/web/app/'(app)'/alerts apps/web/components/alerts
git commit -m "feat(web): /alerts redesign — KAYA tokens + filter tabs + density"
```
