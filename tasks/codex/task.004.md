# task.004 — Add shared TS base config

**Type:** 🤖 Codex
**Depends on:** task.002
**Commit:** `chore: add tsconfig.base.json`

---

## Read first
`tasks/00_AI_AGENT_RULES.md`

## Goal
Create a single shared `tsconfig.base.json` at the repo root that apps and packages will `extends` later. Also install TypeScript at the workspace root.

## Files to create

### `tsconfig.base.json`
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "declaration": true,
    "declarationMap": true
  },
  "exclude": ["node_modules"]
}
```

## Commands
```powershell
pnpm add -Dw typescript@^5.5.0
```
(`-Dw` = devDependency at workspace root.)

## Acceptance criteria
- [ ] `tsconfig.base.json` exists with `strict: true`
- [ ] Root `package.json` `devDependencies` includes `"typescript": "^5.5.0"`
- [ ] `pnpm exec tsc --version` prints `5.x.x`

## Commit
```powershell
git add tsconfig.base.json package.json pnpm-lock.yaml
git commit -m "chore: add tsconfig.base.json"
```

## DO NOT
- ❌ Create app-specific tsconfigs yet — those come with each app
- ❌ Create `packages/tsconfig` package yet — that is task.019
