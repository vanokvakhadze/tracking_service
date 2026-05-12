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
