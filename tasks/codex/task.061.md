# task.061 — Zero-data hero panels for dashboard + reports

**Type:** 🤖 Codex
**Phase:** 8 — Post-MVP polish (onboarding UX)
**Depends on:** PR #2 (`fix/dashboard-real-deltas-reports-donut`) merged to main
**Commit:** `feat(empty-states): zero-data hero panels for dashboard + reports`

---

## Read first
- `apps/web/app/(app)/dashboard/page.tsx` — current server component with metric cards + cards grid
- `apps/web/app/(app)/reports/page.tsx`
- `apps/web/components/dashboard/MetricCardV2.tsx` — how "—" placeholders render today
- `apps/web/components/reports/AIInsights.tsx` — recent empty-state ("AI insights მალე")
- `apps/web/app/(app)/onboarding/page.tsx` — the 4-step checklist (link target for empty CTA)
- `apps/web/components/onboarding/OnboardingChecklist.tsx`
- Style note: in any Georgian copy you write, avoid the three hallucinated filler tokens scrubbed in commit `76dc1de` (`docs(beta): scrub BETA_OUTREACH.md of hallucinated Georgian filler tokens`). When in doubt, use `ჯერ არ არის` or `ჯერ მონაცემები არ ჩაწერილა`.

## Goal
A brand-new tenant lands on `/dashboard` (or `/reports`) and sees a page full
of "—" placeholders. That's accurate but ugly + zero-help. Replace those views
with a **hero panel that explains what they'll see here once data exists**,
plus a CTA pointing at `/onboarding`.

The panels must only appear when there is genuinely no data — defined per page
below. Once data exists, render the normal layout as today.

## Files to add (`apps/web/components/dashboard/`)

### `DashboardZeroStateHero.tsx` (new, server)
Renders only when:
- `shifts` count = 0 AND
- `locations` count (where `deleted_at IS NULL`) = 0 AND
- `tenant_memberships` count = 1 (just the admin themselves)

Layout (full-width card at the top of `/dashboard`):
- Illustration placeholder (a simple inline SVG of a flag/marker — no external asset)
- Heading: "კეთილი იყოს შენი მობრძანება TrackPro-ში"
- Body: ~2 lines explaining what the dashboard will show — active shifts, alerts, locations, productivity — once team starts using the app
- Two CTAs:
  - "გადადი onboarding-ზე" → `/onboarding` (primary)
  - "ნიმუშის მონაცემები ჩაიწერე" → links to docs/seed-demo if you want the empty state to be opt-out (lower priority — can be a single button if it complicates things)

If any one of the conditions above is false (e.g. they invited a user but no
shifts yet), do not render this hero — fall through to the normal dashboard.

### `ReportsZeroStateHero.tsx` (new, server)
Renders only when `shifts` count = 0 in the entire tenant. Same idea, copy
adapted for reports:
- Heading: "ჯერ რეპორტი არ არის"
- Body: "როცა გუნდი დაიწყებს ცვლების ჩაწერას, აქ გამოჩნდება სამუშაო საათები, ვიზიტები და ანალიტიკა."
- CTA: "გადადი onboarding-ზე" → `/onboarding`

## Modify
### `apps/web/app/(app)/dashboard/page.tsx`
Run the three count queries in parallel (`shifts`, `locations not deleted`,
`active memberships`). If all three signal a fresh tenant → render
`<DashboardZeroStateHero />` and return early (or wrap the existing layout
under the hero). Otherwise render the existing layout untouched.

### `apps/web/app/(app)/reports/page.tsx`
Same idea — one count for `shifts`, render hero or normal layout.

## Acceptance criteria
- [ ] Fresh tenant (no shifts, no locations, no other members) sees `<DashboardZeroStateHero />` on `/dashboard` — no "—" placeholders below
- [ ] Same tenant sees `<ReportsZeroStateHero />` on `/reports`
- [ ] After inviting a user OR creating a location, dashboard hero hides (we want the normal layout to start showing momentum)
- [ ] After the first shift records, reports hero hides
- [ ] Primary CTA on both heroes routes to `/onboarding`
- [ ] No use of the three filler tokens scrubbed in commit `76dc1de` anywhere in user-visible copy
- [ ] typecheck + build pass

## DO NOT
- ❌ Add a new column/table to track "fresh tenant" — derive from existing count queries
- ❌ Render BOTH the hero AND the normal layout — pick one based on the conditions
- ❌ Add a dismiss button — once data lands, the hero disappears naturally
- ❌ Use a stock illustration library — inline SVG only
- ❌ Touch onboarding flow — the hero just links to it

## Commit
```powershell
git add apps/web/components/dashboard/DashboardZeroStateHero.tsx `
       apps/web/components/reports/ReportsZeroStateHero.tsx `
       apps/web/app/'(app)'/dashboard/page.tsx `
       apps/web/app/'(app)'/reports/page.tsx
git commit -m "feat(empty-states): zero-data hero panels for dashboard + reports"
```

## Estimated effort
**~3-4 hours** of Codex work.
