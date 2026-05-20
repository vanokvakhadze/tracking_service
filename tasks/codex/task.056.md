# task.056 — Locations v2 polish (richer cards + analytics rail)

**Type:** 🤖 Codex
**Phase:** 8 — Post-MVP polish (design alignment)
**Depends on:** none — current `/locations` works, layout is already 1.4fr/1fr
**Commit:** `feat(web): locations v2 polish — stat strip + hero cards + analytics rail`

---

## Read first
- `design_system/Locations v2.html` (298 lines) — **source of truth**
- `design_system/_shared.css` — design tokens
- `apps/web/app/(app)/locations/page.tsx` — current server component
- `apps/web/components/locations/LocationsPageClient.tsx` — current client wrapper
- `apps/web/components/locations/LocationsList.tsx` — flat button list (will be replaced)
- `apps/web/components/locations/types.ts` — LocationRow + LocationCategory
- Sub-pages: keep as-is (`new/page.tsx`, `pending/page.tsx`, `[id]/work-zone/page.tsx`)

## Goal
Locations page structure is correct (1.4fr/1fr grid, search row, sub-header). What
drifts is the **density of information** per location row and the missing **analytics
rail** in the right column. This is a polish pass, not a rebuild.

```
1. Sub-header — title + view-mode toggle (grid/list/map) + export + "+ ახალი ლოკაცია"
2. Stat strip — 4 KPI cards (total locations, visits today, avg dwell, pending count)
3. Search + 5 category chips (replacing the current <select>)
4. Main grid (1.4fr/1fr unchanged):
   - LEFT: 6 hero cards in 2 rows (LocationHeroCard, NOT flat buttons)
   - RIGHT: map + TopLocationsRail
```

## Files to add/modify (`apps/web/components/locations/`)

### `LocationStatStrip.tsx` (new, server)
4 cards: total locations, visits today (sum of `location_pings.recorded_at = today`),
average dwell minutes (avg of `geofence_events` enter→exit pairs today), pending count
(already shown in sidebar badge — same query).

### `LocationHeroCard.tsx` (new, client)
Replaces the row in `LocationsList`. One card per location:
- Header banner — 80px tall, gradient background per category:
  - `office` → primary gradient
  - `client_site` → violet gradient
  - `warehouse` → success gradient
  - `checkpoint` → warning gradient
  - `other` → muted gradient
- Category badge top-left, status pill (active/inactive) top-right
- Title (h-lg) + address (12px secondary) below banner
- 2-stat row: visits (count from geofence_events today), avg dwell minutes
- Occupancy bar — % of zone capacity if `boundary_radius_m` is set; else hide
- Up to 3 team avatars at bottom (employees currently in zone — derive from active shifts + most-recent enter event)
- Footer buttons: "დეტალები" → opens existing detail pane, "⋯" menu

Gradient colors via `var(--color-accent)` → `var(--color-accent-soft)` etc. — no
hex codes.

### `TopLocationsRail.tsx` (new, server)
Right column below the map card. Lists top 7 locations by visit count today:
- Row: rank + name + bar (proportional to max) + count
- Card header "ტოპ ლოკაცია"
- Empty state: "ჯერ ვიზიტი არ ყოფილა"

### `LocationsViewToggle.tsx` (new, client)
3-button segmented control: grid (default) / list (current minimal layout) / map (Mapbox full-screen of all locations). State stored in URL: `?view=grid|list|map`.

### `CategoryChips.tsx` (new, client)
Replaces the current `<select>` in `LocationsPageClient.tsx` lines 87–101. 5 chips:
ყველა · {n}, ოფისი · {n}, ფილიალი · {n}, საწყობი · {n}, სხვა · {n}. Active chip
uses `var(--color-accent)` background.

### Modify `LocationsPageClient.tsx`
- Render `LocationStatStrip` above search row
- Replace `<select>` with `<CategoryChips>`
- Replace `<LocationsList>` with `<LocationHeroCard>` grid (2 columns, 2-3 rows visible)
- Add `<TopLocationsRail>` to right column below map card
- Add `<LocationsViewToggle>` to sub-header `actions` slot
- Keep existing detail pane logic — clicking a hero card still opens detail on the right

### Keep
- `LocationsList.tsx` — still rendered when `view=list`; the flat layout has its place for power users
- `LocationDetailCard.tsx` (current right-pane content)
- All sub-pages — no changes

## Acceptance criteria
- [ ] Stat strip renders 4 KPI cards above the search row
- [ ] CategoryChips replaces the select dropdown
- [ ] LocationHeroCard renders with category-coloured gradient + badge + stats
- [ ] Occupancy bar shows when `boundary_radius_m` is defined
- [ ] Team avatars (up to 3) show employees currently in zone
- [ ] TopLocationsRail shows top 7 by today's visits with bars
- [ ] View toggle (grid/list/map) works and persists via URL param
- [ ] All KAYA tokens — gradients via `var(--color-*)` only
- [ ] Sub-pages (new / pending / work-zone) still work (smoke test by navigating)
- [ ] typecheck + build pass

## DO NOT
- ❌ Delete `LocationsList.tsx` — it's still used for the list view
- ❌ Touch sub-pages — those mockups are for different flows
- ❌ Add a new RPC just for stats — derive from existing tables in parallel queries
- ❌ Use a UI library for the hero card — pure Tailwind + tokens

## Commit
```powershell
git add apps/web/components/locations apps/web/app/'(app)'/locations/page.tsx
git commit -m "feat(web): locations v2 polish — stat strip + hero cards + analytics rail"
```

## Estimated effort
**~20-30 hours** of Codex work. Medium scope.
