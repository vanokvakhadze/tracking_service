# TrackPro

TrackPro is a B2B SaaS GPS employee-tracking product for the Georgian market.
The repo is a pnpm/Turborepo monorepo with a Next.js admin web app, an Expo
mobile app, shared Supabase database types, and operational task docs.

See [tasks/00_INDEX.md](tasks/00_INDEX.md) for the phase plan and
[tasks/codex/00_QUEUE.md](tasks/codex/00_QUEUE.md) for the Codex task queue.

## Current Status

- Web app: Next.js 16 App Router, Supabase Auth/RLS, admin dashboards, users,
  locations, reports, settings, super-admin pages, and billing preview UI.
- Mobile app: Expo 54 / React Native admin and employee flows.
- Billing: Stripe server code and the Supabase `stripe-webhook` Edge Function
  exist, but `/billing` is still preview-only until
  [task.045](tasks/codex/task.045.md) activates the live UI.
- Email: invite emails use Resend when `RESEND_API_KEY` is configured. Missing
  email credentials log and continue; the invitation record is still created.

## Requirements

- Node.js `>=20`
- pnpm `10.33.2` recommended. The repo declares `packageManager:
  pnpm@10.33.2`; the engine allows pnpm `>=9`.
- Supabase CLI for database type generation and Edge Function deploys.

## Quick Start

From the repo root:

```powershell
pnpm install
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item apps/mobile/.env.example apps/mobile/.env
pnpm dev
```

Fill the env files before using Supabase, Mapbox, Stripe, or Resend features.
The web app runs on `http://localhost:3000`; the mobile app runs through Expo.

## Common Commands

```powershell
pnpm dev          # run all dev tasks through Turborepo
pnpm build        # build all packages/apps
pnpm lint         # run repo lint tasks
pnpm typecheck    # run TypeScript checks
pnpm test         # run test tasks where configured
pnpm db:types     # regenerate Supabase types into packages/database/src/types.ts
pnpm seed:demo    # create/reset the app-review demo tenant
```

## Monorepo Layout

- `apps/web` - Next.js 16 admin web app and marketing pages.
- `apps/mobile` - Expo 54 mobile app for employees and admins.
- `packages/database` - generated Supabase database types.
- `packages/i18n` - shared message files.
- `packages/tsconfig` - shared TypeScript config.
- `supabase/migrations` - SQL migrations.
- `supabase/functions` - Supabase Edge Functions such as `stripe-webhook` and
  `geofence-event`.
- `tasks` - project plans, operating checklists, and per-task Codex briefs.
- `design_system` - KAYA v2 HTML mockups.

## Environment Variables

Web local env lives in `apps/web/.env.local` and starts from
[apps/web/.env.example](apps/web/.env.example).

Core web:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` - server-only
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `NEXT_PUBLIC_APP_URL`

Stripe web/server:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_BASIC`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_ENTERPRISE`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - present in the template; the current
  checkout action is server-redirect based and does not read it directly.

Stripe Edge Function secrets for `supabase/functions/stripe-webhook`:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Email:

- `RESEND_API_KEY`
- `EMAIL_FROM` - optional, defaults to `TrackPro <onboarding@resend.dev>`

Sentry:

- `NEXT_PUBLIC_SENTRY_DSN` for the browser client.
- `SENTRY_DSN` for server/edge runtime.
- `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` for source-map upload.

Sentry client initialization uses
[apps/web/instrumentation-client.ts](apps/web/instrumentation-client.ts), not
the legacy `sentry.client.config.ts`. Server and Edge runtime setup is loaded
through [apps/web/instrumentation.ts](apps/web/instrumentation.ts).

Mobile env lives in `apps/mobile/.env` and starts from
[apps/mobile/.env.example](apps/mobile/.env.example):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_MAPBOX_TOKEN`

## Operational Docs

- [tasks/STRIPE_ACTIVATION.md](tasks/STRIPE_ACTIVATION.md) - Stripe setup,
  webhook events, and live activation checklist.
- [tasks/EMAIL_INFRASTRUCTURE.md](tasks/EMAIL_INFRASTRUCTURE.md) - Resend invite
  email setup and production checklist.
- [tasks/REMAINING_WORK.md](tasks/REMAINING_WORK.md) - current open launch and
  branch-sync work.
