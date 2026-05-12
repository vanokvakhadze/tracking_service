# task.019 — Create `packages/tsconfig`

**Type:** 🤖 Codex
**Depends on:** task.004
**Commit:** `feat(tsconfig): add shared tsconfig package`

---

## Read first
`tasks/00_CONVENTIONS.md`

## Goal
Create the workspace package `@trackpro/tsconfig` containing three shared TS configs (`base`, `nextjs`, `react-native`) that apps will `extends`.

## Files to create

### `packages/tsconfig/package.json`
```json
{
  "name": "@trackpro/tsconfig",
  "version": "0.0.1",
  "private": true,
  "files": ["base.json", "nextjs.json", "react-native.json"]
}
```

### `packages/tsconfig/base.json`
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "../../tsconfig.base.json"
}
```

### `packages/tsconfig/nextjs.json`
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "incremental": true,
    "noEmit": true,
    "allowJs": true,
    "resolveJsonModule": true,
    "plugins": [{ "name": "next" }]
  }
}
```

### `packages/tsconfig/react-native.json`
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-native",
    "noEmit": true,
    "allowJs": true,
    "resolveJsonModule": true,
    "types": ["react-native"]
  }
}
```

## Commands
```powershell
pnpm install
```

## Acceptance criteria
- [ ] `packages/tsconfig/` contains exactly: `package.json`, `base.json`, `nextjs.json`, `react-native.json`
- [ ] `pnpm install` recognises the workspace package (no warnings)
- [ ] Listing workspace shows it: `pnpm -r list --depth=-1 | findstr tsconfig`

## Commit
```powershell
git add packages/tsconfig pnpm-lock.yaml
git commit -m "feat(tsconfig): add shared tsconfig package"
```

## DO NOT
- ❌ Make any app `extends` this yet — that wiring happens when we touch each app's tsconfig later
