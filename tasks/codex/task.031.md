# task.031 — Setup Sentry on mobile

**Type:** 🤖 Codex + 👤 (Gio creates Sentry project + pastes DSN)
**Depends on:** task.018
**Commit:** `chore(monitoring): integrate sentry for mobile`

---

## Read first
`tasks/00_AI_AGENT_RULES.md`

## Pre-step (Gio — manual)
1. https://sentry.io → "Create project" → React Native → name `trackpro-mobile`
2. Copy the **DSN**
3. Paste into `apps/mobile/.env` as:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://xxx@oxxx.ingest.sentry.io/xxx
   ```
   And into `apps/mobile/.env.example` as `EXPO_PUBLIC_SENTRY_DSN=`.

**STOP here and tell Codex the DSN is ready before continuing.**

## Commands (Codex)
```powershell
cd apps/mobile
pnpm add @sentry/react-native
npx @sentry/wizard@latest -s -i reactNative
cd ../..
```

The wizard will:
- Update `app.config.ts` / `app.json` with the Sentry plugin
- Add `sentry.config.ts`
- Configure source maps

Initialize Sentry early — open `apps/mobile/App.tsx` (or `app/_layout.tsx` if Expo Router) and ensure the wizard added a top-level `Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN })` block. If not, add it manually following the wizard's docs.

## Acceptance criteria
- [ ] `@sentry/react-native` is in `apps/mobile/package.json` dependencies
- [ ] Wizard-generated files committed (typically `sentry.config.ts`, modified `app.config.ts` or `app.json`)
- [ ] Auth token / org-token files are in `.gitignore`
- [ ] Test error: temporarily call `Sentry.captureException(new Error('test'))` in `App.tsx`, run the app in Expo Go, confirm the event arrives in Sentry. Revert before commit.

## Commit
```powershell
git add apps/mobile/package.json apps/mobile/app.config.* apps/mobile/sentry.config.ts apps/mobile/.env.example pnpm-lock.yaml
git commit -m "chore(monitoring): integrate sentry for mobile"
```

## DO NOT
- ❌ Commit auth tokens
- ❌ Leave the `captureException` test in `App.tsx`
