# task.005 — Add Biome config + format/lint scripts

**Type:** 🤖 Codex
**Depends on:** task.003
**Commit:** `chore: add biome for formatting and linting`

---

## Read first
`tasks/00_AI_AGENT_RULES.md`, `tasks/00_CONVENTIONS.md` § "Commit Message Format" (for ref).

## Goal
Add Biome as the formatter + linter at the workspace root. Add `format` and `format:check` scripts.

## Files to create

### `biome.json` (root)
```json
{
  "$schema": "https://biomejs.dev/schemas/1.8.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "off"
      },
      "suspicious": {
        "noExplicitAny": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded",
      "trailingCommas": "all"
    }
  },
  "files": {
    "ignore": ["node_modules", ".next", "dist", ".turbo", "design_system", "**/*.html"]
  }
}
```

## Files to modify

### `package.json` (root) — add scripts + dep
After this task, root `scripts` should include:
```json
"format": "biome format --write .",
"format:check": "biome format ."
```
And `devDependencies` should include:
```json
"@biomejs/biome": "^1.8.0"
```

## Commands
```powershell
pnpm add -Dw @biomejs/biome@^1.8.0
pnpm format:check
```

## Acceptance criteria
- [ ] `biome.json` exists at repo root
- [ ] `pnpm format:check` runs (may report issues — that is fine, do not auto-fix in this task)
- [ ] Scripts `format` + `format:check` exist in root `package.json`

## Commit
```powershell
git add biome.json package.json pnpm-lock.yaml
git commit -m "chore: add biome for formatting and linting"
```

## DO NOT
- ❌ Run `pnpm format` (auto-fix) in this task — keep changes minimal
- ❌ Touch `design_system/*.html` — it is intentionally ignored
