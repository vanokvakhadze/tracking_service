# task.012 — Install web app dependencies

**Type:** 🤖 Codex
**Depends on:** task.011
**Commit:** `chore(web): install runtime dependencies`

---

## Read first
`tasks/00_AI_AGENT_RULES.md` § "Tech Stack"

## Goal
Install all runtime + dev dependencies that `apps/web` needs in the rest of Phase 0 + Phase 1. One commit.

## Commands

All commands run from repo root, scoped to the web app via `--filter`:

```powershell
# Supabase + state
pnpm --filter @trackpro/web add @supabase/supabase-js @supabase/ssr zustand @tanstack/react-query

# Validation + forms
pnpm --filter @trackpro/web add zod react-hook-form @hookform/resolvers

# UI utilities
pnpm --filter @trackpro/web add clsx tailwind-merge lucide-react

# Maps + i18n
pnpm --filter @trackpro/web add mapbox-gl next-intl

# Dev: mapbox types
pnpm --filter @trackpro/web add -D @types/mapbox-gl
```

## Acceptance criteria
- [ ] `apps/web/package.json` `dependencies` includes: `@supabase/supabase-js`, `@supabase/ssr`, `zustand`, `@tanstack/react-query`, `zod`, `react-hook-form`, `@hookform/resolvers`, `clsx`, `tailwind-merge`, `lucide-react`, `mapbox-gl`, `next-intl`
- [ ] `apps/web/package.json` `devDependencies` includes: `@types/mapbox-gl`
- [ ] `pnpm install` produces no warnings about unmet peer deps for these packages
- [ ] `pnpm --filter @trackpro/web typecheck` (if defined) or `pnpm --filter @trackpro/web build` passes

## Commit
```powershell
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): install runtime dependencies"
```

## DO NOT
- ❌ Use these packages anywhere in code yet — installation only
- ❌ Add `react-native-*` or Expo deps — those are mobile (task.017)
- ❌ Add Stripe or Sentry — those come in Phase 5 / task.030 respectively
