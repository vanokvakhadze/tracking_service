# task.059 — Code quality sweep (`as any`, unused imports, dead TODOs)

**Type:** 🤖 Codex
**Phase:** 8 — Post-MVP polish (hygiene)
**Depends on:** —
**Commit:** `chore(quality): typed casts replaced, unused imports removed, stale TODOs cleared`

---

## Read first
- `tasks/00_AI_AGENT_RULES.md`
- `apps/web/biome.json` + `apps/mobile/biome.json` (or workspace config) — current rules
- `packages/database/src/types.ts` — supabase generated types you'll be importing instead of `any`

## Goal
Mechanical cleanup pass — no behavior changes. Three buckets:

1. **Remove every `as any` cast** that can be replaced with a real type
2. **Delete unused imports** flagged by biome
3. **Resolve TODO/FIXME comments** that are either obsolete or actionable

Keep the commit small and reviewable. **If a cast cannot be replaced safely,
leave it but add a one-line `// biome-ignore lint/suspicious/noExplicitAny: <reason>`
comment explaining why (e.g. "supabase types not regenerated after migration X").**
Do **not** sneak in feature changes or formatting churn — biome --write only on
files you actually edit, not the whole repo.

## Files to scan

### `as any` casts
Run from repo root:
```powershell
rg "as any" apps/web/app apps/web/components apps/web/lib `
  apps/mobile/src `
  packages
```

Expected categories:
- **Stale Supabase types after a migration** — `(supabase as any).from('tenant_alert_settings')...` — these stay (with `biome-ignore` comment) until the user runs `pnpm db:types`. Annotate the migration date so it's obvious when the cast is safe to remove.
- **Mapbox / Expo SDK gaps** — keep but annotate
- **Real fixes** — anything where the type exists and the cast was a shortcut. Replace.

For each cast left in place, the comment must look like:
```ts
// biome-ignore lint/suspicious/noExplicitAny: supabase types not regenerated after migration 20260521000001 — drop after `pnpm db:types`
const { data } = await (supabase as any).from('tenant_alert_settings')...
```

### Unused imports
```powershell
cd apps/web; pnpm exec biome check --write .
cd ../mobile; pnpm exec biome check --write .
```
Review the diff — biome only deletes the import line, not whole files. If it
removed an import you actually need (mistaken because the symbol is only
referenced in JSX), restore it manually. Should be very few of those.

### Stale TODO/FIXME
```powershell
rg "TODO|FIXME|XXX" apps/web/app apps/web/components apps/mobile/src
```

For each match, decide:
- **Obsolete** — the thing is done or no longer relevant → delete the comment
- **Open but tracked elsewhere** — replace with a one-liner referencing the task/issue, e.g. `// task.061: zero-data hero panel`
- **Open and not tracked** — file a new task brief if it's user-visible, otherwise delete

Do **not** open new GitHub issues. Track in `tasks/codex/`.

## Acceptance criteria
- [ ] `rg "as any"` repo result shrinks substantially (target: at least half the current count). Every remaining cast has a `biome-ignore` comment with a one-line reason.
- [ ] `pnpm exec biome check .` reports zero unused-import errors in apps/web + apps/mobile
- [ ] `rg "TODO|FIXME|XXX"` count goes down (target: ≤ 5 remaining, each pointing at a known task)
- [ ] `pnpm typecheck` passes in apps/web + apps/mobile
- [ ] `pnpm build` passes in apps/web
- [ ] No behavior changes — diff should be limited to types, imports, and comments

## DO NOT
- ❌ Reformat files biome does not touch on its own
- ❌ Rename variables or extract helpers
- ❌ "Fix" a function while you're there — separate PR
- ❌ Run biome on the whole repo — only on files you actually edit
- ❌ Remove `as any` casts whose underlying type genuinely does not exist yet — keep the cast and document why

## Commit
```powershell
git add -A  # safe here because changes are scoped to types + imports + comments
git commit -m "chore(quality): typed casts replaced, unused imports removed, stale TODOs cleared"
```

## Estimated effort
**~3-5 hours** of Codex work.
