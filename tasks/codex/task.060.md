# task.060 — Docs staleness pass (README + STRIPE_ACTIVATION + EMAIL)

**Type:** 🤖 Codex
**Phase:** 8 — Post-MVP polish (docs)
**Depends on:** —
**Commit:** `docs(staleness): refresh README + STRIPE_ACTIVATION + add EMAIL_INFRASTRUCTURE`

---

## Read first
- `README.md` (root)
- `apps/web/README.md` (if exists)
- `apps/mobile/README.md` (if exists)
- `tasks/STRIPE_ACTIVATION.md`
- `tasks/TESTING_CHECKLIST.md`
- `tasks/REMAINING_WORK.md`
- `apps/web/lib/email/send-invite-email.ts` — Resend wiring (canonical source for the EMAIL doc)
- `apps/web/app/api/webhooks/stripe/route.ts` — webhook reality check
- `package.json` (root + apps/web + apps/mobile) — versions, scripts

## Goal
Three docs touched, plus one new file. Every doc is judged against the actual
current code — anything that no longer matches reality is rewritten or removed.

### 1. Root `README.md`
Things that have probably gone stale since it was last touched:
- Node / pnpm version requirements (verify against current `package.json` `engines`)
- "Phase 3 SDK not yet enabled" or similar mobile placeholders (Phase 3 SDK-free shipping; geofence-event Edge Function deployed)
- `pnpm install` → `pnpm dev` → quickstart should actually work after a fresh clone
- Env-var list (cross-check `apps/web/.env.example` + `apps/mobile/.env.example`)
- Sentry section — must mention `instrumentation-client.ts` (NOT `sentry.client.config.ts`)
- Links to other docs (TESTING_CHECKLIST, STRIPE_ACTIVATION, etc.) — verify they resolve
- Remove any reference to features that do not exist (no fake screenshots, no "AI insights" being live, etc.)

Add (if missing): one paragraph on the monorepo layout (`apps/web`, `apps/mobile`, `packages/database`, `supabase/`).

### 2. `tasks/STRIPE_ACTIVATION.md`
Verify against the current code:
- `apps/web/lib/stripe/server.ts` — actual env var names
- `apps/web/app/(app)/billing/checkout-action.ts` — current redirect URLs
- `apps/web/app/api/webhooks/stripe/route.ts` — events the webhook actually handles
- `apps/web/app/(app)/billing/page.tsx` — current plan codes

Remove any "you need to also do X" step that the code now does automatically.
Replace any literal placeholder Stripe IDs (`price_test_...`) with a clear
"replace with your live price ID from the Stripe dashboard" callout.

### 3. New: `tasks/EMAIL_INFRASTRUCTURE.md`
Currently undocumented. Write a one-page brief covering:
- **Provider:** Resend (transactional)
- **Env vars:** `RESEND_API_KEY`, `EMAIL_FROM` — what they default to + what they should be in production
- **Code:** `apps/web/lib/email/send-invite-email.ts` (template + send), called by `invite-action.ts` (single) + `bulk-invite-action.ts` (CSV)
- **Templates:** invite email (HTML + text fallback)
- **DNS:** what records the user has to add for a custom `EMAIL_FROM` domain (SPF, DKIM via Resend dashboard)
- **Production checklist:** how to verify deliverability before the first real customer (test invite to a personal address, check Resend logs, confirm no spam folder)
- **Graceful degrade:** what happens if `RESEND_API_KEY` is unset (today: log + continue, the invite is still created — UI should not surface "email sent" if the key was missing). Verify this matches the actual code.

### 4. Sanity-check `tasks/REMAINING_WORK.md`
Cross-reference with `tasks/codex/00_QUEUE.md`. Anything done in tasks
.001–.060 should not be listed as remaining. Anything still open should appear
in both places.

## Acceptance criteria
- [ ] Root `README.md` quickstart runs successfully from a fresh clone
- [ ] `STRIPE_ACTIVATION.md` matches the actual code (env vars, plan codes, webhook events)
- [ ] `EMAIL_INFRASTRUCTURE.md` exists and covers provider / envs / DNS / verification
- [ ] `REMAINING_WORK.md` cross-checked against the codex queue
- [ ] No broken intra-doc links (manual click-through of each `[...]` reference)
- [ ] No mention of features that do not exist in the current code

## DO NOT
- ❌ Rewrite the whole README — surgical edits only
- ❌ Add aspirational features ("we plan to add X") — describe what exists, not what's planned
- ❌ Move docs to a new location — keep current paths
- ❌ Add a `CONTRIBUTING.md` or `CODE_OF_CONDUCT.md` — out of scope here

## Commit
```powershell
git add README.md tasks/STRIPE_ACTIVATION.md tasks/EMAIL_INFRASTRUCTURE.md tasks/REMAINING_WORK.md
git commit -m "docs(staleness): refresh README + STRIPE_ACTIVATION + add EMAIL_INFRASTRUCTURE"
```

## Estimated effort
**~4-6 hours** of Codex work.
