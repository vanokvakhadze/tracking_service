# task.002 — Init pnpm workspace

**Type:** 🤖 Codex
**Depends on:** task.001
**Commit:** `chore: init pnpm workspace`

---

## Read first
`tasks/00_AI_AGENT_RULES.md`

## Goal
Create the root `package.json`, `pnpm-workspace.yaml`, and `.npmrc` so pnpm recognises this as a monorepo. Run `pnpm install` once to generate the lockfile.

## Files to create

### `package.json` (root)
```json
{
  "name": "trackpro",
  "private": true,
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  },
  "packageManager": "pnpm@10.33.2",
  "scripts": {
    "clean": "rimraf node_modules"
  },
  "devDependencies": {
    "rimraf": "^6.0.1"
  }
}
```

> Scripts for `build`/`dev`/`lint`/`typecheck`/`test` come in task.003 (Turborepo) and task.005 (Biome).

### `pnpm-workspace.yaml`
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### `.npmrc`
```
auto-install-peers=true
strict-peer-dependencies=false
shamefully-hoist=false
```

## Commands
```powershell
pnpm install
```

## Acceptance criteria
- [ ] `pnpm install` runs without errors
- [ ] `pnpm-lock.yaml` exists at repo root
- [ ] `node_modules/` exists at repo root
- [ ] `git status` shows new files only: `package.json`, `pnpm-workspace.yaml`, `.npmrc`, `pnpm-lock.yaml`

## Commit
```powershell
git add package.json pnpm-workspace.yaml .npmrc pnpm-lock.yaml
git commit -m "chore: init pnpm workspace"
```

## DO NOT
- ❌ Add Turborepo / Biome / TypeScript yet — separate tasks
- ❌ Create `apps/` or `packages/` folders
