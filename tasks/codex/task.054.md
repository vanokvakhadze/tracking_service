# task.054 — Dashboard v2 rebuild per design_system mockup

**Type:** 🤖 Codex
**Phase:** 8 — Post-MVP polish (design alignment)
**Depends on:** none — current `/dashboard` is a 3-card placeholder; v2 mockup has ~10 cards
**Commit:** `feat(web): dashboard v2 rebuild — hero, sparklines, schedule, team, performance, alerts`

---

## Read first
- `design_system/Dashboard v2.html` (721 lines) — **source of truth**. Open in browser before coding.
- `design_system/_shared.css` — design tokens
- `tasks/reference/DESIGN_RULES.md` — KAYA system
- `apps/web/app/(app)/dashboard/page.tsx` — current placeholder (will be rewritten)
- `apps/web/components/dashboard/LiveShiftsCard.tsx` — keep this (Realtime pattern); the new TeamStatusCard can wrap/reuse it
- `apps/web/components/dashboard/DashboardLiveMap.tsx` — keep this for the map card

## Goal
The current `/dashboard` renders 4 metric cards + map + active-users card. The v2
mockup specifies a richer admin overview:

```
1. Hero greeting + 3 live stats inline                              [HeroGreeting]
2. Metric strip — 4 cards w/ sparklines + delta indicators          [MetricCardV2 × 4]
3. Map + tasks                                                       [DashboardLiveMap | TasksCard]
4. Schedule + team status                                            [ScheduleCard | TeamStatusCard]
5. Team performance + active alerts                                  [TeamPerformanceCard | ActiveAlertsCard]
```

Each row is `grid-cols-2` (or `1.55fr/1fr` for asymmetric rows — see mockup).

## Files to add (`apps/web/components/dashboard/`)
Each is a Server Component unless interactivity is required (only LiveShiftsCard +
the alerts realtime is client-side; rest can be SSR).

### `HeroGreeting.tsx`
Server Component. Props: `{ name: string; activeNow: number; totalUsers: number; distanceTodayKm: number; visitsToday: number }`. Renders:
- Greeting "გამარჯობა, {name} 👋" (h-xl)
- One-line context message (e.g., "8 თანამშრომელი ცოცხალია · 2 ცვლა იწყება საათში")
- Three inline stat pills: "ცოცხალია now: 18/24", "მანძილი დღეს: 247 კმ", "ვიზიტი: 86"

### `MetricCardV2.tsx`
Server Component. Props: `{ label: string; value: string; deltaPct?: number; trend?: number[]; tone?: 'accent' | 'success' | 'warning' | 'error'; icon: LucideIcon }`. Renders:
- Label (h-sm uppercase tracking)
- Value (24px, tabular-nums)
- Delta below: `↑+12%` / `↓-3%` with success/error tone
- Inline `<Sparkline points={trend} />` (last 7 data points)

### `Sparkline.tsx`
Pure SVG component. Props: `{ points: number[]; height?: number; color?: string }`. Renders an area + line chart 60×24 by default. No charting library — just polyline + path with `pathLength=100`.

### `TasksCard.tsx`
Server Component. Props: `{ tasks: { id: string; title: string; due: string; assignee?: string; overdue?: boolean }[] }`. Renders:
- Card header "დღევანდელი დავალებები · 5 დარჩა"
- Vertical list of task rows
- "3 ვადაგადაცილებული" warning pill at top if any `overdue`

For v1, this can be **stubbed with empty array** until a tasks table exists in DB.
Show empty state "დავალებები ჯერ არ არის · დაიწყე ცვლა მობილური აპლიკაციით".

### `ScheduleCard.tsx`
Server Component. Props: `{ shifts: ScheduleVM[] }` where each shift is one row of `{ user_name; start; end; status }`.
- 4-person timeline rendered as horizontal bars
- Now-indicator vertical line at current time
- For v1, derive from `shifts` table joined to `users` — show today's shifts only.
- Empty state: "დღევანდელი ცვლები არ არის".

### `TeamStatusCard.tsx`
Client Component (Realtime). Props: `{ tenantId: string; initialMembers: TeamMemberVM[] }`.
- Reuse `LiveShiftsCard`'s Realtime pattern (channel on `shifts` table)
- Each row: avatar + name + location/team + status pill (active/idle/off) + time-ago
- Status derived from latest `shift` + most recent `geofence_event`

### `TeamPerformanceCard.tsx`
Server Component. Props: `{ rows: { location: string; trend: number[]; current: number }[] }`.
- Card header "გუნდის პროდუქტიულობა · ბოლო 7 დღე"
- Avg productivity %, attendance % at top
- Per-location sparkline + current % row
- For v1, **stub** with empty data + "მონაცემები 7 დღეში მზადდება" if no shifts yet

### `ActiveAlertsCard.tsx`
Server Component. Props: `{ alerts: AdminAlert[] }`.
- Card header "აქტიური ალერტი · {n}"
- Up to 3 most recent rows from `get_admin_alerts` RPC
- Each row: severity-coloured left bar + icon + title + user name + timestamp
- "ყველა alerts →" link at bottom → `/alerts`
- Empty state: "ალერტი არ არის. გუნდი ნორმალურად მუშავდება."

### `dashboard/page.tsx` (rewrite)
Server Component. Fetches everything in one parallel `Promise.all`:
- Active shifts + users join (for HeroGreeting + ScheduleCard + TeamStatusCard)
- Locations (for DashboardLiveMap)
- Recent geofence_events (for ActiveAlertsCard — or call `get_admin_alerts` directly)
- Metric counts (active shifts, distance today via sum of `shifts.total_distance_m`, alerts count, locations count)

Pass to the 9 cards. Layout:

```tsx
<SubHeader title="ცოცხალი დაშბორდი" liveLabel="ცოცხალია" />
<main className="p-6 space-y-4">
  <HeroGreeting ... />
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <MetricCardV2 ... /> × 4
  </div>
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
    <DashboardLiveMap ... />
    <TasksCard ... />
  </div>
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <ScheduleCard ... />
    <TeamStatusCard ... />
  </div>
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <TeamPerformanceCard ... />
    <ActiveAlertsCard ... />
  </div>
</main>
```

## Acceptance criteria
- [ ] All 8 new components exist and render
- [ ] Each card matches its mockup section visually (8px radius, 1px border, no shadow per KAYA)
- [ ] Sparkline component is reusable across MetricCardV2 + TeamPerformanceCard
- [ ] All KAYA tokens — no hardcoded hex outside Sparkline default color
- [ ] Empty states for all cards that depend on data not yet flowing (Tasks, Schedule, Performance)
- [ ] TeamStatusCard receives Realtime updates within 2s of shift open/close on mobile
- [ ] typecheck + build pass

## DO NOT
- ❌ Use a charting library — Sparkline is a 40-line SVG component
- ❌ Add new DB tables for Tasks — stub the component until a real backlog exists
- ❌ Fetch via REST/serverless endpoints — keep everything inside the Server Component data fetch
- ❌ Subscribe to Realtime in more than one component — TeamStatusCard is enough
- ❌ Delete LiveShiftsCard / DashboardLiveMap — TeamStatusCard can wrap LiveShiftsCard; DashboardLiveMap stays as-is

## Commit
```powershell
git add apps/web/components/dashboard apps/web/app/'(app)'/dashboard/page.tsx
git commit -m "feat(web): dashboard v2 rebuild — hero, sparklines, schedule, team, performance, alerts"
```
