# task.032 — GitHub Actions CI workflow

**Type:** 🤖 Codex
**Depends on:** task.012, task.017
**Commit:** `chore(ci): add github actions for typecheck/lint/build`

---

## Read first
`tasks/00_AI_AGENT_RULES.md`

## Goal
Add one GitHub Actions workflow that runs install + typecheck + format-check + build on every push and PR to `main` / `develop`.

## File to create

### `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Format check
        run: pnpm format:check

      - name: Typecheck
        run: pnpm --filter @trackpro/web exec tsc --noEmit && pnpm --filter @trackpro/mobile exec tsc --noEmit

      - name: Build web
        run: pnpm --filter @trackpro/web build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_MAPBOX_TOKEN: ${{ secrets.NEXT_PUBLIC_MAPBOX_TOKEN }}
```

## Pre-step (Gio — manual)
Add three GitHub Actions secrets at **repo Settings → Secrets and variables → Actions → New repository secret** (same values as `apps/web/.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

> `SUPABASE_SERVICE_ROLE_KEY` is **not** needed at build time. Leave it out.

## Acceptance criteria
- [ ] `.github/workflows/ci.yml` exists with content above
- [ ] The 3 secrets exist in GitHub repo settings (Gio confirms)
- [ ] Open a PR (or push to `develop`) and the `CI` workflow runs to green

## Commit
```powershell
git add .github/workflows/ci.yml
git commit -m "chore(ci): add github actions for typecheck/lint/build"
```

## DO NOT
- ❌ Bake `lint` into CI before Biome rules are tuned — `format:check` is enough for now
- ❌ Add a mobile build job — Expo prebuild + EAS is a Phase 3 concern, not Phase 0 CI
