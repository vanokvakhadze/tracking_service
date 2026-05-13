# task.051 — Health check endpoint + Vercel Analytics

**Type:** 🤖 Codex
**Phase:** 8 — Post-MVP polish (production observability)
**Depends on:** Vercel deploy (already live)
**Commit:** `feat(observability): health endpoint + vercel analytics`

---

## Read first
- `tasks/00_HANDOFF.md`
- `apps/web/app/layout.tsx` — root layout
- `apps/web/sentry.client.config.ts` — existing observability layer

## Goal
Two small wins that pay off the moment we hit Beta traffic:

1. **`/api/health`** — a 200/503 endpoint that uptime monitors hit. Returns
   "ok" iff the DB roundtrip succeeds, otherwise "down" with the broken
   dependency named.
2. **Vercel Analytics + Speed Insights** — first-party RUM with one line of
   code each. Free tier, zero overhead. Tells us p75 page load, route-level
   error rates, country breakdown.

Both unblock the "is the site up?" question when a customer says "trackpro.ge
is broken" — we can answer with data instead of guesses.

## Files to add

### `apps/web/app/api/health/route.ts`
```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface HealthBody {
  status: 'ok' | 'degraded' | 'down'
  ts: string
  checks: {
    database: 'ok' | 'down'
    error?: string
  }
}

export async function GET() {
  const startedAt = Date.now()
  const body: HealthBody = {
    status: 'ok',
    ts: new Date().toISOString(),
    checks: { database: 'ok' },
  }

  // Cheapest possible DB roundtrip — `select 1` via a known table.
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('subscription_plans')
      .select('id', { head: true, count: 'exact' })
      .limit(1)
    if (error) {
      body.status = 'down'
      body.checks.database = 'down'
      body.checks.error = error.message
    }
  } catch (err) {
    body.status = 'down'
    body.checks.database = 'down'
    body.checks.error = err instanceof Error ? err.message : 'unknown'
  }

  const took = Date.now() - startedAt
  const status = body.status === 'ok' ? 200 : 503

  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Health-Latency-Ms': String(took),
    },
  })
}
```

### Install Vercel Analytics package

```powershell
pnpm --filter @trackpro/web add @vercel/analytics @vercel/speed-insights
```

## Files to modify

### `apps/web/app/layout.tsx`
Render `<Analytics />` + `<SpeedInsights />` just before `</body>`. Both are
no-ops outside Vercel hosting so they don't break local dev.

```tsx
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

// inside <body>:
{children}
<Analytics />
<SpeedInsights />
```

### `apps/web/middleware.ts`
Add `/api/health` to the matcher exclusion so the Supabase session-refresh
middleware doesn't run on every uptime ping (cheap, but pointless cost):

```ts
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## Acceptance criteria
- [ ] `GET /api/health` returns `{ status: 'ok', ... }` with HTTP 200 when DB is up
- [ ] `GET /api/health` returns `{ status: 'down', ... }` with HTTP 503 when
      the Supabase URL env var is missing (test by unsetting it locally)
- [ ] `X-Health-Latency-Ms` response header is present
- [ ] Vercel Analytics shows page views in the dashboard within 5 minutes
      of the next production deploy
- [ ] Speed Insights surfaces Core Web Vitals (CLS, LCP, FID) per route
- [ ] typecheck + format:check pass

## Commit
```powershell
git add apps/web/app/api/health/route.ts apps/web/app/layout.tsx apps/web/middleware.ts apps/web/package.json pnpm-lock.yaml
git commit -m "feat(observability): health endpoint + vercel analytics"
```

## DO NOT
- ❌ Health-check against the service-role client — endpoint must be safe
      to call publicly. Anon-key roundtrip is the right level.
- ❌ Make `/api/health` heavy — keep it under 100ms p95. Uptime monitors
      hit this every 60s.
- ❌ Add Plausible/PostHog/etc. — Vercel-native tools are free + zero-config.
      Migrate to a heavier RUM later if we need product-level analytics.
