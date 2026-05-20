# task.055 — Reports v2 rebuild per design_system mockup

**Type:** 🤖 Codex
**Phase:** 8 — Post-MVP polish (design alignment)
**Depends on:** task.054 Sparkline component (or build it here if .054 isn't merged)
**Commit:** `feat(web): reports v2 rebuild — hero chart + heatmap + leaderboard + insights`

---

## Read first
- `design_system/Reports v2.html` (1177 lines — the biggest mockup, **read it all**)
- `design_system/_shared.css` — design tokens
- `tasks/reference/DESIGN_RULES.md`
- `apps/web/app/(app)/reports/page.tsx` — current minimal page (will be rewritten)
- `apps/web/components/reports/*.tsx` — existing MetricCard, ShiftsTable, ExportButton, AnnotateShiftDialog (keep export/annotate; ShiftsTable moves below the analytics)
- `apps/web/app/(app)/reports/export-action.ts` + `annotate-action.ts` (no changes)

## Goal
The current `/reports` is a metric strip + ShiftsTable. The v2 mockup is a full
analytics dashboard. Build it in **layers** — get the structural sections in first,
then fill in real data per section. Don't block on perfect data.

```
1. Sub-header — title + range pills (7d/30d/90d) + team chips + export + primary CTA
2. Metric strip — 4 cards w/ sparklines + delta indicators
3. Hero chart (1.55fr) + Live feed (1fr)
4. Heatmap (1.55fr) + Leaderboard (1fr)
5. Top locations (1fr) + AI insights (1fr)
6. Mini-map (1.55fr) + Donut chart (1fr)
7. ShiftsTable (full-width, below analytics)
```

## Files to add (`apps/web/components/reports/`)

### `RangeFilter.tsx` (client)
Segmented control for `today | 7d | 30d | 90d` + team chip row (Tbilisi/Batumi/Kutaisi/all). Stores selection in URL `?range=7d&team=tbilisi` so SSR can read it.

### `HeroChart.tsx` (client SVG — no library)
Multi-series time-series area chart. Props: `{ series: { name: string; color: string; points: number[] }[]; labels: string[] }`. ~140 lines of pure SVG. Animate stroke-dashoffset on mount. Legend toggles series visibility.

### `LiveFeed.tsx` (client, Realtime)
Subscribes to `geofence_events` table for tenant. Each new event prepends a row. Max 30 rows visible. Pause button stops the subscription. Row: icon + user + action + timestamp.

### `Heatmap.tsx` (server)
24-hour × 7-day grid. Props: `{ matrix: number[][] }` — 7 rows × 24 cols. Color scale 0–100. Cell hover shows tooltip. Data source: COUNT(geofence_events) GROUP BY hour-of-day, day-of-week over the selected range.

### `Leaderboard.tsx` (server)
Top 7 users by productivity score. Score = (active minutes / scheduled minutes) × 100. Row: rank + avatar + name + score bar + delta vs prev period.

### `TopLocations.tsx` (server)
Top 7 locations by visit count. Row: name + visit count + horizontal bar (proportional).

### `AIInsights.tsx` (server, **stub**)
For v1, hardcode 3 example insight cards (alerts, warnings, info). The "AI" generation can be a separate task — but leave the card structure so the layout doesn't shift later. Each card: icon + title + body + action button.

### `MiniMap.tsx` (client)
Reuses `MapboxMap` from `apps/web/components/map/MapboxMap.tsx`. Smaller size, shows the same data the live-map page shows but constrained to a card. Click → links to `/live-map`.

### `DonutChart.tsx` (server SVG — no library)
Time-distribution donut. Props: `{ segments: { label: string; value: number; color: string }[] }`. Pure SVG circle with stroke-dasharray segments. Center shows total. Legend below.

### `reports/page.tsx` (rewrite)
Server Component. Read `searchParams.range` + `searchParams.team`. Compute date window. Parallel `Promise.all` for:
- Hero chart series (active shifts per day, distance per day, alerts per day — 3 series)
- Heatmap matrix (group by hour-of-day, day-of-week)
- Leaderboard rows
- Top-locations rows
- Donut chart segments (sum dwelling time bucketed: at-location / in-transit / on-break / out-of-zone)
- Metric strip values (totals + deltas vs prior period)
- ShiftsTable rows (unchanged)

Layout per mockup, with the existing ShiftsTable at the bottom.

## Acceptance criteria
- [ ] All 9 new components exist and render
- [ ] HeroChart renders 3 series with toggle legend
- [ ] Heatmap renders 7×24 cells with color gradient
- [ ] Leaderboard ranks users by computed productivity score
- [ ] RangeFilter changes URL params → SSR re-fetches → all cards update
- [ ] LiveFeed appends new events via Realtime within 2s
- [ ] Existing ShiftsTable + export/annotate workflows still work
- [ ] All KAYA tokens — no hardcoded hex outside chart `color` props
- [ ] Empty/loading states for every card (e.g. "მონაცემები 7 დღეში მზადდება" when no data)
- [ ] typecheck + build pass

## DO NOT
- ❌ Use Recharts / Chart.js / Victory / any charting library — all charts are <200-line SVG components
- ❌ Add new DB tables — derive everything from existing `shifts`, `geofence_events`, `location_pings`, `users`
- ❌ Compute heatmap client-side — push the GROUP BY to SQL via an RPC if needed
- ❌ Delete `MetricCard`, `ShiftsTable`, `ExportButton`, `AnnotateShiftDialog` — they all stay
- ❌ Implement real AI in AIInsights — that's task.058+ if it ever happens. Stub only.

## Commit
```powershell
git add apps/web/components/reports apps/web/app/'(app)'/reports/page.tsx
git commit -m "feat(web): reports v2 rebuild — hero chart + heatmap + leaderboard + insights"
```

## Estimated effort
**80-120 hours** of Codex work. If too large for one session, split into two:
- `task.055a`: structural shell + metric strip + RangeFilter + HeroChart + LiveFeed
- `task.055b`: heatmap + leaderboard + top-locations + AI + mini-map + donut
