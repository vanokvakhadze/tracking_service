# task.017 — Install mobile app dependencies

**Type:** 🤖 Codex
**Depends on:** task.016
**Commit:** `chore(mobile): install runtime dependencies`

---

## Read first
`tasks/00_AI_AGENT_RULES.md` § "Tech Stack" + the explicit warning **not** to install `react-native-background-geolocation` in Phase 0.

## Goal
Install all the React Native / Expo runtime deps that `apps/mobile` needs in Phase 0 + 1.

## Commands

All from repo root, scoped via `--filter`:

```powershell
# Supabase + storage
pnpm --filter @trackpro/mobile add @supabase/supabase-js react-native-url-polyfill react-native-mmkv

# State + data
pnpm --filter @trackpro/mobile add zustand @tanstack/react-query

# Validation + forms
pnpm --filter @trackpro/mobile add zod react-hook-form

# Navigation
pnpm --filter @trackpro/mobile add @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs

# Required peer deps for navigation
pnpm --filter @trackpro/mobile add react-native-screens react-native-safe-area-context react-native-gesture-handler

# Maps + Expo native modules
pnpm --filter @trackpro/mobile add react-native-maps
pnpm --filter @trackpro/mobile add expo-camera expo-location expo-notifications expo-secure-store

# i18n
pnpm --filter @trackpro/mobile add expo-localization i18n-js
```

## Acceptance criteria
- [ ] All packages above are in `apps/mobile/package.json` `dependencies`
- [ ] `react-native-background-geolocation` is **NOT** installed
- [ ] `pnpm install` exits cleanly
- [ ] `pnpm --filter @trackpro/mobile start` still boots Metro (open the URL in Expo Go to sanity-check is optional)

## Commit
```powershell
git add apps/mobile/package.json pnpm-lock.yaml
git commit -m "chore(mobile): install runtime dependencies"
```

## DO NOT
- ❌ Install `react-native-background-geolocation` — Phase 3 only
- ❌ Wire any of these into code yet — installation only
- ❌ Touch native iOS/Android folders (Expo manages these for now)
