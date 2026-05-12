# task.023 — Create `packages/i18n` ka + en stubs

**Type:** 🤖 Codex
**Depends on:** task.019
**Commit:** `feat(i18n): add i18n package with ka and en stubs`

---

## Read first
`tasks/00_CONVENTIONS.md` § "i18n Pattern"

## Goal
Create the `@trackpro/i18n` workspace package with two starter translation files (Georgian + English). Wiring into `next-intl` / `i18n-js` happens later in Phase 2.

## Files to create

### `packages/i18n/package.json`
```json
{
  "name": "@trackpro/i18n",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "devDependencies": {
    "@trackpro/tsconfig": "workspace:*",
    "typescript": "^5.5.0"
  }
}
```

### `packages/i18n/tsconfig.json`
```json
{
  "extends": "@trackpro/tsconfig/base.json",
  "compilerOptions": {
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

### `packages/i18n/src/index.ts`
```typescript
import ka from './messages/ka.json'
import en from './messages/en.json'

export const messages = { ka, en } as const
export type Locale = keyof typeof messages
```

### `packages/i18n/src/messages/ka.json`
```json
{
  "common": {
    "loading": "იტვირთება...",
    "error": "შეცდომა",
    "save": "შენახვა",
    "cancel": "გაუქმება",
    "delete": "წაშლა",
    "edit": "რედაქტირება"
  }
}
```

### `packages/i18n/src/messages/en.json`
```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  }
}
```

## Commands
```powershell
pnpm install
pnpm --filter @trackpro/i18n exec tsc --noEmit
```

## Acceptance criteria
- [ ] `packages/i18n/` contains the 5 files above
- [ ] `pnpm --filter @trackpro/i18n exec tsc --noEmit` passes

> Cross-package import resolution (and the `messages.ka.common.save === "შენახვა"` runtime check) is verified later when a consumer (apps/web or apps/mobile) adds `"@trackpro/i18n": "workspace:*"` to its dependencies. Not testable inside this task by design of pnpm workspaces.

## Commit
```powershell
git add packages/i18n pnpm-lock.yaml
git commit -m "feat(i18n): add i18n package with ka and en stubs"
```

## DO NOT
- ❌ Add `next-intl` / `i18n-js` integration here — that lives in apps, not the package
- ❌ Add more keys than the `common.*` stubs — Phase 2 will grow these per-feature
