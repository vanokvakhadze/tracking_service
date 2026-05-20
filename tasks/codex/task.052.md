# task.052 — /live-map redesign to match design_system/Live Map v2.html

**Type:** 🤖 Codex
**Phase:** 8 — Post-MVP polish
**Depends on:** none (current `/live-map` is a placeholder that doesn't follow the mockup)
**Commit:** `feat(web): /live-map redesign per design_system v2 mockup`

---

## Read first
- `design_system/Live Map v2.html` — **source of truth** for this page. Open it in a browser and screenshot the result before writing any code.
- `design_system/_shared.css` — design tokens used by the mockup
- `tasks/reference/DESIGN_RULES.md` — KAYA design system (font sizes, spacing, colors)
- `apps/web/app/(app)/live-map/page.tsx` — current placeholder implementation (will be rewritten)
- `apps/web/components/dashboard/LiveMapFullscreen.tsx` — current client component (will be rewritten or split)
- `apps/web/components/map/MapboxMap.tsx` — the Mapbox wrapper we already have; reuse, don't replace
- `apps/web/components/dashboard/LiveShiftsCard.tsx` — Realtime shift subscription pattern (copy this pattern)

## Goal
The current `/live-map` page is a minimal 2-column placeholder. The KAYA design system
already has a fully-specced v2 mockup. Align the page to that mockup.

The mockup is a **3-column** layout:

```
┌──────────────────────────────────────────────────────────────────┐
│ Sub-header                                                       │
│ [Title + subtitle]  [live flag]   [city seg] [saved] [+geofence]│
├──────────┬──────────────────────────────────┬───────────────────┤
│ LEFT     │ CENTER — map                     │ RIGHT             │
│ 320px    │ • stat pills overlay (top-left)  │ 320px             │
│          │ • zoom controls (top-right)      │                   │
│ search   │ • geofence circles               │ tracker details:  │
│ filters  │ • animated tracker dots          │ - avatar+name+team│
│          │ • route paths                    │ - 4-stat grid     │
│ tracker  │                                  │ - battery donut   │
│ list     │                                  │ - timeline        │
│ (scrolls)│                                  │ - action buttons  │
└──────────┴──────────────────────────────────┴───────────────────┘
```

The current implementation has no left filter panel and no detail panel — just map +
shift list. Codex must build all three columns.

## Files to add / modify

### `apps/web/app/(app)/live-map/page.tsx`
Server component fetches the data and passes to client. Pull these per `tenant_id`:

- **active shifts** with `users` join (id, user_id, started_at, user.first_name/last_name/email)
- **locations** (id, name, latitude, longitude, radius_m, is_active)
- **recent geofence_events** (last 4 hours) per active shift — for timeline + status colouring

Pass them down to a single client component `<LiveMapView ... />`.

### `apps/web/components/live-map/LiveMapView.tsx` (new)
Three-column client component, subscribed via Supabase Realtime to:
- `shifts` table (`tenant_id=eq.{tid}`)
- `geofence_events` table (`tenant_id=eq.{tid}`) — append new events as they arrive
- `location_pings` table (optional, only if you wire it up — current code doesn't subscribe here)

State shape (one zustand-ish reducer or just `useState` — keep it simple):
```ts
interface TrackerVM {
  id: string                 // shift id
  user_id: string
  name: string
  team: string              // "Tbilisi · ცენტრალური ოფისი" — derive from latest geofence_event.location or fallback
  status: 'active' | 'idle' | 'off'
  timeLabel: string         // "2ს 14წთ" — based on shift.started_at vs now
  initials: string          // "გმ"
  avatarBg: string          // deterministic from user_id (pick from a small palette)
  avatarFg: string
  lat: number | null        // pin position — from last location_ping or last enter event
  lng: number | null
}
```

### `apps/web/components/live-map/TrackerListPanel.tsx` (new)
Left 320px panel:
- Search input (filter list client-side by name)
- Filter chips (ყველა / აქტიური / დაყოვნება / გათიშული) with active state
- Vertical list of trackers (avatar, name, team, time-label, status dot)
- Click → selects tracker → propagates up to parent

### `apps/web/components/live-map/TrackerDetailPanel.tsx` (new)
Right 320px panel:
- Header: 44px avatar + name + role + ⋮ menu button
- 4-stat grid (status / dwell / distance today / speed) — for v1, stub distance + speed with
  `—` if you don't have the data yet. Live status + dwell are derivable from shift.started_at.
- Battery donut: real value if `location_pings.battery_level` was recorded most recently, else `—%`
- Timeline: latest geofence_events for this shift, newest at top. Each event becomes one row.
- Bottom actions: call / history / ··· — for v1 the "call" + "···" can be disabled buttons; "ისტორია" should link to `/users/[id]/shifts` if you have that route, else disabled.

### `apps/web/components/live-map/MapStage.tsx` (new)
- Wraps the existing `<MapboxMap />` — do **not** rewrite Mapbox.
- Renders the map at flex: 1 between left/right panels
- Overlays:
  - Top-left stat pills (live count / idle / geofence count) — these are absolutely positioned siblings, not Mapbox controls
  - Top-right zoom +/- + locate + layers buttons — for v1, the "+/-" buttons can call `map.zoomIn()/zoomOut()`. "locate" + "layers" can be no-op buttons.
  - Geofence circles — `MapboxMap` already supports `radiusM`, but only for the *draggable* pin. Either extend MapboxMap to draw a circle per static marker, OR render geofences as simple Mapbox source/layer with `circle` paint (the mockup uses dashed CSS circles, but on a real map we want proper geographic circles).
- Marker color per tracker status: active = `var(--color-success)`, idle = `var(--color-warning)`, off = `var(--color-text-tertiary)`.

### `apps/web/components/dashboard/LiveMapFullscreen.tsx`
**Delete this file.** It's superseded by `LiveMapView`.

## Acceptance criteria
- [ ] `/live-map` renders 3-column layout matching `design_system/Live Map v2.html` proportions
- [ ] Tracker list filters work (search input + 4 chips)
- [ ] Clicking a tracker selects it: highlights both list row and map marker, populates right panel
- [ ] Right panel timeline shows actual `geofence_events` rows newest-first
- [ ] Stat pills top-left show **real** counts (count of active shifts, idle shifts, location count)
- [ ] Realtime: starting a shift on mobile makes a new tracker appear in the list within 2s
- [ ] Realtime: ending a shift removes it from the list
- [ ] Empty state: when 0 active shifts, list shows "ჯერ ცვლები არ არის" (current copy) and map shows pins only
- [ ] All KAYA tokens — no hardcoded hex outside `_shared.css`/design system; use `var(--color-*)`
- [ ] Sidebar entry "ცოცხალი რუკა" stays at `/live-map` (no change there)
- [ ] typecheck + build pass

## DO NOT
- ❌ Rewrite Mapbox — extend `MapboxMap.tsx` if needed
- ❌ Add a charting library — battery donut is a 60-line SVG, see the mockup
- ❌ Block on missing data — if `location_pings` table is empty, show `—` and move on. Reviewer/launch isn't blocked by perfect data.
- ❌ Mount Realtime subscriptions per-tracker — one channel per table, fan out via state
- ❌ Use Zustand for this — local state is fine for a single page

## Commit
```powershell
git add apps/web/app/'(app)'/live-map apps/web/components/live-map apps/web/components/dashboard/LiveMapFullscreen.tsx
git commit -m "feat(web): /live-map redesign per design_system v2 mockup"
```

The `LiveMapFullscreen.tsx` deletion is part of this commit (will appear as a deletion in
the diff alongside the new files).
