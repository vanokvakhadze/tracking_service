# TrackPro Remaining Work

Last checked against code: 2026-05-21.

This file tracks work that is still open after the current Codex queue pass. It
does not repeat completed tasks from `tasks/codex/task.001.md` through the
current task unless there is a follow-up operational action.

## Current Baseline

- Task briefs `task.058.md`, `task.059.md`, `task.060.md`, and `task.061.md`
  exist in `tasks/codex`.
- `tasks/codex/00_QUEUE.md` is stale: it still stops at task.045 and does not
  index the Phase 8 briefs.
- Stripe server code and `supabase/functions/stripe-webhook` exist. Live UI
  activation is still open under [task.045](codex/task.045.md).
- Resend invite email code exists. Production email domain setup is still open;
  see [EMAIL_INFRASTRUCTURE.md](EMAIL_INFRASTRUCTURE.md).

## Immediate Engineering Work

1. Sync the branch before PR.
   Current local branch has commits ahead of `origin/main` and is also behind
   `origin/main`. Pull/rebase or merge carefully before opening the final PR.

2. Update the Codex queue index.
   Add the Phase 8 rows for task.058 through task.061 to
   `tasks/codex/00_QUEUE.md` so open work appears in the queue as well as in
   this file.

3. Implement or merge task.058.
   The current branch does not contain the self-serve account deletion flow or
   its account-delete RPC migration. Use `tasks/codex/task.058.md`.

4. Implement or merge task.059.
   The current branch still has `as any` casts for `tenant_alert_settings`.
   Use `tasks/codex/task.059.md` or regenerate DB types after the alert-settings
   migration is applied.

5. Apply latest migrations to the target Supabase project.
   At minimum, check whether these local migrations have been applied remotely:
   - `supabase/migrations/20260521000001_tenant_alert_settings.sql`

6. Regenerate database types after remote migrations.
   Run `pnpm db:types` only after the remote schema includes the migrations
   above, then commit generated type changes if any.

7. Fix the root lint environment issue if it still reproduces.
   Earlier root lint runs failed in the mobile lint task with an `EPERM` scan of
   `C:\Users\Zaza`. Re-run and clean up the Expo ESLint path behavior before
   treating lint as a reliable release gate.

## Launch Blockers

1. Stripe live billing activation.
   Follow [STRIPE_ACTIVATION.md](STRIPE_ACTIVATION.md) and then execute
   [task.045](codex/task.045.md) to switch `/billing` from preview-only to live
   checkout and portal UI.

2. Production email domain and Resend setup.
   Set `RESEND_API_KEY`, verify SPF/DKIM in Resend, set `EMAIL_FROM` to a
   verified sender, and validate single/bulk invite copy. Details:
   [EMAIL_INFRASTRUCTURE.md](EMAIL_INFRASTRUCTURE.md).

3. Production Supabase Edge Function secrets.
   Confirm `stripe-webhook` has live `STRIPE_SECRET_KEY` and
   `STRIPE_WEBHOOK_SECRET` after Stripe activation. Add `RESEND_API_KEY` to
   `geofence-event` only if alert email fan-out is intentionally enabled.

4. Production web env and deployment check.
   Confirm Vercel has Supabase, Mapbox, Sentry, Stripe, Resend, and
   `NEXT_PUBLIC_APP_URL` values for the target domain. Do not commit real env
   values.

5. Store submission readiness.
   Apple Developer team activation, iOS dev build, App Store submission, and
   Google Play submission are still operational work. Use
   [STORE_METADATA.md](STORE_METADATA.md) and [08_PHASE_POLISH.md](08_PHASE_POLISH.md)
   as the copy/source checklist.

6. Legal review.
   The Georgian privacy and terms pages should be reviewed by counsel before
   production launch.

## Product Follow-Ups

- Zero-data / empty-state polish for first-run tenants. If this is the next
  numbered Codex task, use `tasks/codex/task.061.md`.
- Billing quantity auto-sync when active users change after a subscription is
  created. Current checkout quantity is calculated at checkout time.
- Post-MVP geofence reliability upgrade with the paid Transistorsoft SDK if the
  Expo-based approach is not reliable enough in beta.
- Customer onboarding docs and beta outreach materials from the polish phase.

## Useful Links

- [00_HANDOFF.md](00_HANDOFF.md) - current project handoff.
- [STRIPE_ACTIVATION.md](STRIPE_ACTIVATION.md) - Stripe operations.
- [EMAIL_INFRASTRUCTURE.md](EMAIL_INFRASTRUCTURE.md) - Resend operations.
- [STORE_METADATA.md](STORE_METADATA.md) - store listing copy.
- [08_PHASE_POLISH.md](08_PHASE_POLISH.md) - launch/polish phase details.
