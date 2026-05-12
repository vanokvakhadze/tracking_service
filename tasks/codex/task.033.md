# task.033 — Add CI as required status check on `main`

**Type:** 👤 Manual (GitHub branch protection UI)
**Depends on:** task.032
**Commit:** N/A

---

## Goal
Now that the CI workflow exists and has run at least once on `develop`, add it as a **required status check** on the `main` branch so broken PRs cannot merge.

---

## Steps

1. Trigger CI at least once on `develop` (push a no-op commit or merge any PR). Wait until it shows green on GitHub → Actions.
2. GitHub → repo Settings → Branches → click the rule for `main` → "Edit".
3. Enable **Require status checks to pass before merging**.
4. In the search box for status checks, search `CI` (the workflow `name` from `ci.yml`) and select the `ci` job.
5. Enable **Require branches to be up to date before merging** (recommended).
6. Save.

Apply the same to `develop` if you want symmetric protection (optional).

## Acceptance criteria
- [ ] `main` branch rule shows `CI / ci` as a required status check
- [ ] Open a test PR with an intentionally-failing change (e.g. a TS error). Confirm the merge button is blocked until CI passes. Then close that PR.

---

# 🎉 Phase 0 — DONE

If you reached here with everything green:
- ✅ Monorepo (Turborepo + pnpm)
- ✅ Web app deployed to Vercel staging
- ✅ Mobile app runs locally
- ✅ Supabase project + schema + RLS
- ✅ All env vars wired (local + Vercel + GitHub Secrets)
- ✅ Sentry catching errors on both platforms
- ✅ CI gates `main`

→ Next: ask Claude to prepare the **Phase 1 (Auth + Tenancy)** Codex queue based on `tasks/02_PHASE_AUTH.md`.
