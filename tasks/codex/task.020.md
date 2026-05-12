# task.020 — Create `packages/database` skeleton

**Type:** 🤖 Codex
**Depends on:** task.019
**Commit:** `feat(database): add database package skeleton`

---

## Read first
`tasks/00_CONVENTIONS.md` § "Supabase Patterns"

## Goal
Create the `@trackpro/database` workspace package. Empty types stub for now — task.021 fills it with generated Supabase types.

## Files to create

### `packages/database/package.json`
```json
{
  "name": "@trackpro/database",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "generate": "echo 'Run from repo root: pnpm db:types (defined in task.021)'",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0"
  },
  "devDependencies": {
    "@trackpro/tsconfig": "workspace:*",
    "typescript": "^5.5.0"
  }
}
```

### `packages/database/tsconfig.json`
```json
{
  "extends": "@trackpro/tsconfig/base.json",
  "include": ["src/**/*"]
}
```

### `packages/database/src/index.ts`
```typescript
export type { Database } from './types'
```

### `packages/database/src/types.ts` (PLACEHOLDER — replaced in task.021)
```typescript
// This file is auto-generated in task.021 via `supabase gen types`.
// Placeholder so the package typechecks before that runs.
export type Database = Record<string, unknown>
```

## Commands
```powershell
pnpm install
pnpm --filter @trackpro/database typecheck
```

## Acceptance criteria
- [ ] `packages/database/` contains the 4 files above
- [ ] `pnpm --filter @trackpro/database typecheck` passes

> The `import type { Database } from '@trackpro/database'` resolution is verified later in **task.024**, when `apps/web` declares `"@trackpro/database": "workspace:*"` in its dependencies and pnpm symlinks the workspace package into its `node_modules`. There is no way to verify cross-package import resolution from inside this task — that is by design of pnpm workspaces.

## Commit
```powershell
git add packages/database pnpm-lock.yaml
git commit -m "feat(database): add database package skeleton"
```

## DO NOT
- ❌ Run `supabase gen types` here — that is task.021
- ❌ Add real types manually — they must be generated
