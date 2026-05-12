# task.016 — Scaffold `apps/mobile` with create-expo-app

**Type:** 🤖 Codex
**Depends on:** task.002
**Commit:** `feat(mobile): scaffold expo app`

---

## Read first
`tasks/00_AI_AGENT_RULES.md`, `tasks/00_CONVENTIONS.md` § "File & Folder Naming → Mobile (Expo)"

## Goal
Create `apps/mobile` using `create-expo-app` (default template) and rename it to `@trackpro/mobile`. Do NOT install extra deps — that is task.017.

## Commands
```powershell
# From repo root
cd apps
pnpm create expo-app mobile --template default
cd ../..
```

If the wizard prompts about templates and "default" isn't auto-selected, pick the **blank** / **default (TabNavigator)** template — whichever the CLI calls "default". If it asks anything not covered here, **stop and report**.

## Files to modify

### `apps/mobile/package.json` — set name
Change top-level `"name"` to `"@trackpro/mobile"`. Keep everything else as scaffolded.

## Commands (verify)
```powershell
pnpm install
pnpm --filter @trackpro/mobile start
# In another terminal you could press 'i' (iOS sim) or 'a' (Android emulator)
# Ctrl+C to stop Metro
```

## Acceptance criteria
- [ ] `apps/mobile/` exists with `App.tsx` (or `app/_layout.tsx` if Expo Router) and `app.json` / `app.config.ts`
- [ ] `apps/mobile/package.json` has `"name": "@trackpro/mobile"`
- [ ] `pnpm --filter @trackpro/mobile start` boots Metro bundler without errors

## Commit
```powershell
git add apps/mobile package.json pnpm-lock.yaml pnpm-workspace.yaml
git commit -m "feat(mobile): scaffold expo app"
```

## DO NOT
- ❌ Install `react-native-background-geolocation` — Phase 3 only (license + native build required)
- ❌ Install Supabase / navigation deps — that is task.017
- ❌ Create env file — that is task.018
- ❌ Eject to bare React Native
