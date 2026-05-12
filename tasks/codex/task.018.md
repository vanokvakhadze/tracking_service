# task.018 — Create mobile env file

**Type:** 🤖 Codex
**Depends on:** task.016
**Commit:** `chore(mobile): add env template`

---

## Read first
`tasks/00_CONVENTIONS.md` § "Environment Variables" — `EXPO_PUBLIC_*` is bundled into the mobile build, so never put secrets there.

## Goal
Create `.env` (gitignored by default Expo setup, but we will double-check) and `.env.example` for `apps/mobile`.

## Files to create

### `apps/mobile/.env` (gitignored — placeholders, user replaces with real values from task.008)
```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
EXPO_PUBLIC_MAPBOX_TOKEN=pk.YOUR_MAPBOX_TOKEN
```

### `apps/mobile/.env.example` (committed)
```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_MAPBOX_TOKEN=
```

## Verify ignore

Run:
```powershell
git check-ignore apps/mobile/.env
```
This must print the path (meaning it IS ignored). If it does not print anything, the root `.gitignore` is not matching — check that `.env` (without `.local` suffix) is covered. If not, add the pattern `apps/mobile/.env` to `.gitignore` and re-verify.

## Acceptance criteria
- [ ] `apps/mobile/.env` exists with placeholders
- [ ] `apps/mobile/.env.example` exists with empty values
- [ ] `git status` does NOT list `apps/mobile/.env` (proves ignored)
- [ ] `apps/mobile/.env.example` is tracked

## Commit
```powershell
git add apps/mobile/.env.example
# also commit .gitignore if you had to add a line for apps/mobile/.env
git commit -m "chore(mobile): add env template"
```

## After commit — manual step for Gio
Open `apps/mobile/.env` and paste the real values from task.008 (same `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY`, prefixed with `EXPO_PUBLIC_`). Mapbox token can be the same as web.

## DO NOT
- ❌ Put `SERVICE_ROLE_KEY` in mobile env — it would be bundled to the device
- ❌ Commit `.env`
