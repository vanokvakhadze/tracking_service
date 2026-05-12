# task.003 — Add Turborepo

**Type:** 🤖 Codex
**Depends on:** task.002
**Commit:** `chore: add turborepo config`

---

## Read first
`tasks/00_AI_AGENT_RULES.md`

## Goal
Add Turborepo as a dev dependency at the workspace root and create `turbo.json` with pipeline definitions. Add Turbo-backed scripts to the root `package.json`.

## Files to create

### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

## Files to modify

### `package.json` (root) — add scripts + dep
Merge into the existing `package.json` so that `scripts` and `devDependencies` end up as:

```json
"scripts": {
  "build": "turbo build",
  "dev": "turbo dev",
  "lint": "turbo lint",
  "typecheck": "turbo typecheck",
  "test": "turbo test",
  "clean": "turbo clean && rimraf node_modules"
},
"devDependencies": {
  "rimraf": "^6.0.1",
  "turbo": "^2.0.0"
}
```

## Commands
```powershell
pnpm install
pnpm exec turbo --version
```

## Acceptance criteria
- [ ] `pnpm exec turbo --version` prints `2.x.x`
- [ ] `pnpm build` runs (no workspace packages yet → "no tasks" is fine, no error)
- [ ] `turbo.json` exists
- [ ] `package.json` has the 6 scripts above

## Commit
```powershell
git add package.json pnpm-lock.yaml turbo.json
git commit -m "chore: add turborepo config"
```

## DO NOT
- ❌ Add TS / Biome yet (separate tasks)
- ❌ Create any app or package folders
