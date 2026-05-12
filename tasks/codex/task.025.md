# task.025 — Wire web Supabase server client

**Type:** 🤖 Codex
**Depends on:** task.024
**Commit:** `feat(web): add supabase server client`

---

## Read first
`tasks/00_CONVENTIONS.md` § "Supabase Patterns → Client vs Server"

## Goal
Create the server-side Supabase client factory used in Server Components, Route Handlers, and Server Actions.

## File to create

### `apps/web/lib/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@trackpro/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Called from a Server Component — ignore (middleware will refresh)
          }
        },
      },
    },
  )
}
```

## Commands
```powershell
pnpm --filter @trackpro/web build
```

## Acceptance criteria
- [ ] `apps/web/lib/supabase/server.ts` exists
- [ ] `pnpm --filter @trackpro/web build` passes
- [ ] Import path `@/lib/supabase/server` resolves (because `apps/web/tsconfig.json` has `@/*` alias from scaffold)

## Commit
```powershell
git add apps/web/lib/supabase/server.ts
git commit -m "feat(web): add supabase server client"
```

## DO NOT
- ❌ Use `SUPABASE_SERVICE_ROLE_KEY` here — server client uses anon key + RLS, service role only for admin operations
- ❌ Wire the middleware yet — task.026
