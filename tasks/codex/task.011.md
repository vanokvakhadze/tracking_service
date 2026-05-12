# task.011 — Scaffold `apps/web` with create-next-app

**Type:** 🤖 Codex
**Depends on:** task.002
**Commit:** `feat(web): scaffold next.js app`

---

## Read first
`tasks/00_AI_AGENT_RULES.md`, `tasks/00_CONVENTIONS.md` § "File & Folder Naming → Web (Next.js)"

## Goal
Create `apps/web` using `create-next-app` with TypeScript + Tailwind + App Router. Rename the package to `@trackpro/web`. Do NOT add any extra deps yet — that is task.012.

## Commands
```powershell
# From repo root
cd apps  # create the apps/ folder first if missing
mkdir apps 2>$null
cd apps
pnpm create next-app@latest web --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint --turbopack --use-pnpm
cd ../..
```

If `create-next-app` prompts interactively for anything not specified by flags (e.g. it asks about Turbopack in some versions), accept the defaults shown above. If you have to answer interactively, **stop and report which questions it asked** — do not guess.

## Files to modify

### `apps/web/package.json` — set name
Change the top-level `"name": "web"` to `"name": "@trackpro/web"`. Keep everything else as scaffolded.

## Commands (verify)
```powershell
pnpm install
pnpm --filter @trackpro/web dev
# open http://localhost:3000 → should show Next.js default page
# Ctrl+C to stop
```

## Acceptance criteria
- [ ] `apps/web/` exists with `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `next.config.ts` (or `.js`), `tsconfig.json`, `package.json`
- [ ] `apps/web/package.json` has `"name": "@trackpro/web"`
- [ ] `pnpm --filter @trackpro/web dev` opens the Next.js default page at `localhost:3000`
- [ ] No `apps/web/.eslintrc*` (we use Biome instead)

## Commit
```powershell
git add apps/web package.json pnpm-lock.yaml pnpm-workspace.yaml
git commit -m "feat(web): scaffold next.js app"
```

## DO NOT
- ❌ Install Supabase / Mapbox / Zustand / etc. — that is task.012
- ❌ Replace `globals.css` — that is task.013
- ❌ Replace `page.tsx` — that is task.015
- ❌ Create `.env.local` — that is task.014
