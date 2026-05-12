# task.030 — Setup Sentry on web

**Type:** 🤖 Codex + 👤 (Gio creates Sentry project, pastes DSN)
**Depends on:** task.015
**Commit:** `chore(monitoring): integrate sentry for web`

---

## Read first
`tasks/00_AI_AGENT_RULES.md`

## Pre-step (Gio — manual)
1. Go to https://sentry.io → create org if needed → "Create project" → Next.js → name `trackpro-web`
2. Copy the **DSN** (looks like `https://xxx@oxxx.ingest.sentry.io/xxx`)
3. Paste it into `apps/web/.env.local` as:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@oxxx.ingest.sentry.io/xxx
   ```
   And into `apps/web/.env.example` as `NEXT_PUBLIC_SENTRY_DSN=` (empty value).

**STOP here and tell Codex the DSN is ready before continuing.**

## Goal (Codex)
Run the Sentry Next.js wizard which auto-creates `sentry.*.config.ts` files and updates `next.config`. Then commit only the generated configs (no secrets).

## Commands
```powershell
cd apps/web
pnpm dlx @sentry/wizard@latest -i nextjs
cd ../..
```

The wizard will ask:
- "Which version of Next.js?" → 15 (auto-detected)
- "Use existing Sentry DSN?" → yes, paste the DSN from above (or use the env var)
- "Wrap server components / route handlers?" → yes
- "Configure source maps upload?" → yes (paste/login as prompted; this requires the `SENTRY_AUTH_TOKEN` — the wizard writes it into `.sentryclirc` which IS gitignored by default)

Verify:
```powershell
pnpm --filter @trackpro/web build
```
Should complete and show "Uploading source maps to Sentry" near the end if the auth token is set.

## Acceptance criteria
- [ ] Files created by the wizard (typically): `apps/web/sentry.client.config.ts`, `apps/web/sentry.server.config.ts`, `apps/web/sentry.edge.config.ts`, modifications to `apps/web/next.config.*`, `apps/web/instrumentation.ts`
- [ ] `apps/web/.sentryclirc` is **ignored** by git (check `git check-ignore apps/web/.sentryclirc`); if not, add it to `.gitignore`
- [ ] `pnpm --filter @trackpro/web build` passes
- [ ] In the Sentry project dashboard, trigger a test error: temporarily add a `throw new Error('Sentry test')` in a Server Action or `page.tsx`, hit it, see it appear in Sentry. **Revert the test before committing.**

## Commit
```powershell
git add apps/web/sentry.*.config.ts apps/web/next.config.* apps/web/instrumentation.ts apps/web/.env.example
git commit -m "chore(monitoring): integrate sentry for web"
```

## DO NOT
- ❌ Commit `.sentryclirc` or any auth token
- ❌ Leave the throw-error test in `page.tsx` — revert before commit
