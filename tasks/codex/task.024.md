# task.024 — Wire web Supabase browser client

**Type:** 🤖 Codex
**Depends on:** task.012, task.020
**Commit:** `feat(web): add supabase browser client`

---

## Read first
`tasks/00_CONVENTIONS.md` § "Supabase Patterns → Client vs Server"

## Goal
Create the browser-side Supabase client factory at `apps/web/lib/supabase/client.ts`. This is the client used inside `'use client'` components.

## File to create

### `apps/web/lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@trackpro/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

## Files to modify

### `apps/web/package.json` — add `@trackpro/database` workspace dep
Add to `dependencies`:
```json
"@trackpro/database": "workspace:*"
```

## Commands
```powershell
pnpm install
pnpm --filter @trackpro/web build
```

## Acceptance criteria
- [ ] `apps/web/lib/supabase/client.ts` exists with content above
- [ ] `apps/web/package.json` includes `"@trackpro/database": "workspace:*"`
- [ ] `pnpm --filter @trackpro/web build` passes (no TS errors)
- [ ] Importing `import { createClient } from '@/lib/supabase/client'` from another file is type-safe (try in `page.tsx` to verify autocomplete on table names)

## Commit
```powershell
git add apps/web/lib/supabase/client.ts apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): add supabase browser client"
```

## DO NOT
- ❌ Create the server client here — task.025
- ❌ Use this in `page.tsx` yet — task.027
