# task.015 — Replace web home page placeholder

**Type:** 🤖 Codex
**Depends on:** task.013
**Commit:** `feat(web): replace home page with TrackPro placeholder`

---

## Read first
`tasks/00_AI_AGENT_RULES.md` § "UI/UX" — uses KAYA tokens, no hardcoded hex, no `dark:*`.

## Goal
Replace the scaffolded Next.js demo page with a minimal TrackPro placeholder that proves KAYA tokens work.

## File to modify

### `apps/web/app/page.tsx` (REPLACE entire content)

```tsx
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-[var(--color-accent)] text-[var(--color-accent-fg)] flex items-center justify-center text-2xl font-bold">
          T
        </div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          TrackPro
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          GPS-ის თანამშრომლების ტრექინგი
        </p>
      </div>
    </main>
  )
}
```

## Acceptance criteria
- [ ] Run `pnpm --filter @trackpro/web dev` and visit `http://localhost:3000`
- [ ] You see a blue "T" badge, "TrackPro" heading, and the Georgian subtitle "GPS-ის თანამშრომლების ტრექინგი"
- [ ] No console errors in browser DevTools
- [ ] No hardcoded hex colors in the JSX (only `var(--color-*)`)

## Commit
```powershell
git add apps/web/app/page.tsx
git commit -m "feat(web): replace home page with TrackPro placeholder"
```

## DO NOT
- ❌ Touch `layout.tsx` (we will refine it in Phase 2)
- ❌ Wire Supabase here — that is task.027
- ❌ Add lucide-react icons / animations — keep minimal
