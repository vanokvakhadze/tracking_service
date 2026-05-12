# task.010 — Use Supabase CLI via npx (no global install)

**Type:** 👤 Manual
**Depends on:** task.008
**Commit:** N/A

---

## Goal
Verify the Supabase CLI works via `npx` and log in. **Do NOT install globally** — Supabase blocks npm global installs.

> ⚠️ The original brief said `npm install -g supabase`. That is not supported by Supabase CLI (it errors with *"Installing Supabase CLI as a global module is not supported."*). We use `npx` instead — no install, always latest.

---

## Pre-step (if you already attempted `npm install -g supabase`)
Delete the broken partial install:
```powershell
Remove-Item -Recurse -Force "$env:APPDATA\npm\node_modules\supabase"
```
If you get EPERM — close every terminal / editor that touched `supabase`, then retry. Reboot if it persists.

## Steps

```powershell
# Verify (downloads to npx cache on first run; subsequent runs are fast)
npx supabase --version

# Login — opens browser for auth
npx supabase login
```

## Optional: install via Scoop (if you want a global `supabase` command)
```powershell
# One-time Scoop setup if you don't have it:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Add Supabase bucket + install
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
supabase --version
```
Skip this section if `npx supabase` works for you — that is all task.021 needs.

## Acceptance criteria
- [ ] `npx supabase --version` prints a 1.x or 2.x version
- [ ] `npx supabase login` completed (auth token saved)

## DO NOT
- ❌ `npm install -g supabase` — explicitly blocked by Supabase
- ❌ Commit any auth tokens (CLI saves them in `%USERPROFILE%\.supabase`, outside the repo)
