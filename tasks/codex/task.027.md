# task.027 — Web home fetches plans (sanity check)

**Type:** 🤖 Codex
**Depends on:** task.025, task.014 (real env values must be filled in)
**Commit:** `feat(web): home page fetches plans from supabase`

---

## Read first
`tasks/00_CONVENTIONS.md` § "Supabase Patterns → Query Patterns"

## Pre-condition
- `apps/web/.env.local` has the real Supabase URL + anon key (from task.008)
- `subscription_plans` table has 4 seed rows (free / basic / pro / enterprise) from task.009

If either is missing — **STOP, ask Gio.**

## Goal
Modify `apps/web/app/page.tsx` to fetch the `subscription_plans` table server-side and render the names below the TrackPro badge. This is a one-time end-to-end sanity check. We will remove this in a later task before launch.

## File to modify

### `apps/web/app/page.tsx` (REPLACE entire content)
```tsx
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('id, name')
    .order('name', { ascending: true })

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-[var(--color-accent)] text-[var(--color-accent-fg)] flex items-center justify-center text-2xl font-bold">
          T
        </div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">TrackPro</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          GPS-ის თანამშრომლების ტრექინგი
        </p>

        <div className="mt-8 text-xs text-[var(--color-text-tertiary)]">
          {error ? (
            <span>supabase error: {error.message}</span>
          ) : (
            <span>plans: {plans?.map((p) => p.name).join(' · ') ?? '—'}</span>
          )}
        </div>
      </div>
    </main>
  )
}
```

## Commands
```powershell
pnpm --filter @trackpro/web dev
# load http://localhost:3000
```

## Acceptance criteria
- [ ] Page renders, shows `plans: Basic · Enterprise · Free · Pro` (alphabetical from `subscription_plans` seed)
- [ ] No `supabase error: ...` rendered
- [ ] No console errors in DevTools
- [ ] If you intentionally break the env (rename `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`), the page should show `supabase error: ...` (then restore the env)

## Commit
```powershell
git add apps/web/app/page.tsx
git commit -m "feat(web): home page fetches plans from supabase"
```

## DO NOT
- ❌ Add a loading state, error boundary, or styling for this — it is a throwaway sanity check
- ❌ Cache or memoize — Server Component re-renders are fine for this stage
