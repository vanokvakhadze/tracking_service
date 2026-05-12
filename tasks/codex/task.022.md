# task.022 — Create `packages/ui` skeleton

**Type:** 🤖 Codex
**Depends on:** task.019
**Commit:** `feat(ui): add ui package skeleton`

---

## Read first
`tasks/00_AI_AGENT_RULES.md` § "UI/UX" — KAYA tokens, no hardcoded hex.

## Goal
Create the `@trackpro/ui` workspace package as an empty skeleton. KAYA primitive components (Button, Input, Card, etc.) are scaffolded in Phase 2 — this task only sets up the package.

## Files to create

### `packages/ui/package.json`
```json
{
  "name": "@trackpro/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "peerDependencies": {
    "react": "^18.3.0 || ^19.0.0"
  },
  "devDependencies": {
    "@trackpro/tsconfig": "workspace:*",
    "@types/react": "^18.3.0",
    "react": "^19.0.0",
    "typescript": "^5.5.0"
  }
}
```

### `packages/ui/tsconfig.json`
```json
{
  "extends": "@trackpro/tsconfig/base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["dom", "ES2022"]
  },
  "include": ["src/**/*"]
}
```

### `packages/ui/src/index.ts`
```typescript
// KAYA primitive components — populated in Phase 2.
export {}
```

## Commands
```powershell
pnpm install
pnpm --filter @trackpro/ui exec tsc --noEmit
```

## Acceptance criteria
- [ ] `packages/ui/` contains exactly the 3 files above
- [ ] `pnpm --filter @trackpro/ui exec tsc --noEmit` passes (no source files to compile, no errors)

> Cross-package import resolution is verified later when a consumer (apps/web) adds `"@trackpro/ui": "workspace:*"` to its dependencies. Not testable inside this task by design of pnpm workspaces.

## Commit
```powershell
git add packages/ui pnpm-lock.yaml
git commit -m "feat(ui): add ui package skeleton"
```

## DO NOT
- ❌ Add any components yet — Phase 2 task
- ❌ Add Tailwind / clsx / etc. to this package — components will live in `apps/web/components/ui/` first, only promoted to `packages/ui` when shared between web and another consumer
