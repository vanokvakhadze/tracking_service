# task.026 — Wire web Supabase auth middleware

**Type:** 🤖 Codex
**Depends on:** task.025
**Commit:** `feat(web): add supabase auth middleware`

---

## Read first
`tasks/00_CONVENTIONS.md` § "Supabase Patterns"

## Goal
Add Next.js middleware that refreshes the Supabase auth session cookie on every request. Without this, server components see stale auth state.

## Files to create

### `apps/web/lib/supabase/middleware.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@trackpro/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          supabaseResponse = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // Touch the session so the cookie refresh happens before the response is sent
  await supabase.auth.getUser()
  return supabaseResponse
}
```

### `apps/web/middleware.ts`
```typescript
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

## Commands
```powershell
pnpm --filter @trackpro/web build
pnpm --filter @trackpro/web dev
# load http://localhost:3000 — should work without 500 errors
```

## Acceptance criteria
- [ ] `apps/web/lib/supabase/middleware.ts` and `apps/web/middleware.ts` exist
- [ ] `pnpm --filter @trackpro/web build` passes
- [ ] `pnpm --filter @trackpro/web dev` serves the home page without 500 errors
- [ ] Browser DevTools → Application → Cookies shows a `sb-*-auth-token` cookie shape (even when not logged in, the request is hit)

## Commit
```powershell
git add apps/web/lib/supabase/middleware.ts apps/web/middleware.ts
git commit -m "feat(web): add supabase auth middleware"
```

## DO NOT
- ❌ Add route protection logic here — that lives in Phase 1 (`02_PHASE_AUTH.md`)
- ❌ Use `SUPABASE_SERVICE_ROLE_KEY` in middleware
