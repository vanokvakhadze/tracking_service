# task.006 — Update README + .gitignore polish

**Type:** 🤖 Codex
**Depends on:** task.002
**Commit:** `docs: update README and gitignore`

---

## Read first
`tasks/00_AI_AGENT_RULES.md`

## Goal
Replace the placeholder `README.md` with a real one and add one line to `.gitignore` so `.env.example` files stay tracked even though `.env*` is ignored.

## Files to modify

### `README.md` (REPLACE entire content)
```markdown
# TrackPro

B2B SaaS GPS employee tracking for the Georgian market.

Monorepo: Turborepo + pnpm. See [`tasks/00_INDEX.md`](tasks/00_INDEX.md) for the phase plan and [`tasks/codex/00_QUEUE.md`](tasks/codex/00_QUEUE.md) for the per-task Codex queue.

## Quick start

```bash
pnpm install
pnpm dev
```

## Structure

- `apps/web` — Next.js 15 admin web app
- `apps/mobile` — Expo mobile app (employee + admin)
- `packages/*` — Shared code (database types, UI, i18n, tsconfig)
- `tasks/` — Phased implementation plan + rules
- `design_system/` — KAYA v2 HTML mockups

## Tech stack

Web Next.js 15 · Mobile Expo · Backend Supabase (Postgres + PostGIS) · Maps Mapbox · Payments Stripe.
```

### `.gitignore` (APPEND one line)
Add at the bottom of the existing file:
```
!.env.example
```

## Acceptance criteria
- [ ] `README.md` matches the content above exactly
- [ ] `.gitignore` ends with `!.env.example`
- [ ] No other files changed

## Commit
```powershell
git add README.md .gitignore
git commit -m "docs: update README and gitignore"
```
