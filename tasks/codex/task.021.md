# task.021 — Generate Supabase types into `packages/database`

**Type:** 🤖 Codex (requires `SUPABASE_PROJECT_ID` from task.008)
**Depends on:** task.010, task.020
**Commit:** `chore(database): generate types from supabase staging`

---

## Read first
`tasks/00_CONVENTIONS.md` § "Database Types"

## Goal
Run the Supabase CLI to generate TypeScript types from the live `trackpro-staging` schema. Write a root-level npm script so future regenerations are one command.

## Pre-condition
- You must have the **Supabase Project ID** (the subdomain part of the project URL, captured in task.008).
- `npx supabase login` must have been completed (task.010).

**If you do not have the Project ID handy, STOP and ask Gio.** Do not invent it.

## Files to modify

### `package.json` (root) — add `db:types` script
Merge into root `scripts`:
```json
"db:types": "npx supabase gen types typescript --project-id lekogoghgbvmrlqcqmhv > packages/database/src/types.ts"
```

The project ID is `lekogoghgbvmrlqcqmhv` — taken from the Supabase project URL `https://lekogoghgbvmrlqcqmhv.supabase.co`. It is safe to commit because the project ID is public-shaped (it appears in the URL).

> We use `npx supabase` (not a global `supabase` binary) because Supabase blocks npm global installs — see task.010.

## Commands
```powershell
pnpm db:types
```

This overwrites `packages/database/src/types.ts` with the real generated types (replacing the placeholder from task.020).

```powershell
pnpm --filter @trackpro/database typecheck
```

## Acceptance criteria
- [ ] `packages/database/src/types.ts` contains a generated `export type Database = { public: { Tables: { ... } } }` with `tenants`, `users`, `locations`, `shifts`, etc.
- [ ] `pnpm --filter @trackpro/database typecheck` passes
- [ ] Root `package.json` has `db:types` script
- [ ] Future regeneration is just `pnpm db:types`

## Commit
```powershell
git add package.json packages/database/src/types.ts
git commit -m "chore(database): generate types from supabase staging"
```

## DO NOT
- ❌ Commit auth tokens or service-role keys — `supabase gen types` does not need them, only the project ID
- ❌ Edit `types.ts` by hand
