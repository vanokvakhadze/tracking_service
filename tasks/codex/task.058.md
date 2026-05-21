# task.058 — Self-serve "delete my account" flow

**Type:** 🤖 Codex
**Phase:** 8 — Post-MVP polish (compliance)
**Depends on:** existing `/settings` page + `tenant_memberships` table
**Commit:** `feat(settings): self-serve account deletion with safety checks`

---

## Read first
- `apps/web/app/(app)/settings/page.tsx` — current settings server component
- `apps/web/app/(app)/settings/update-tenant-action.ts` — existing server-action style we follow
- `apps/web/lib/supabase/server.ts` — server client + how auth is read
- `apps/web/lib/observability/report-error.ts` — wire Sentry on failure paths (already used by sibling actions)
- `packages/database/src/types.ts` — confirm column names for `users` and `tenant_memberships`
- `tasks/00_CONVENTIONS.md` § Server Actions

## Goal
A logged-in user must be able to delete their own account from `/settings`. Today
there is no UI for this — they have to email `privacy@trackpro.ge`. Per the
privacy policy ("ანგარიშის წაშლა: მოგვწერე — 30 დღეში ყველაფერი წაიშლება")
this is a documented right, so a self-serve button closes a compliance gap.

The flow must protect against two footguns:
1. The **sole admin of a tenant** cannot delete themselves — that would orphan
   the tenant. They must either transfer admin to someone else first, or delete
   the whole tenant (out of scope here — show inline copy pointing to support).
2. The user must **explicitly confirm** by typing their email address — single
   click should not be enough.

## Files to add

### `apps/web/app/(app)/settings/delete-account-action.ts` (new server action)
```ts
'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { reportServerActionError } from '@/lib/observability/report-error'
import { createClient } from '@/lib/supabase/server'

const Schema = z.object({ confirmEmail: z.string().email() })

export async function deleteMyAccount(formData: FormData) {
  // 1. Read current user via supabase.auth.getUser()
  // 2. Parse confirmEmail; if it does not match user.email → return { error }
  // 3. Read this user's active memberships. If any of those tenants has
  //    only ONE active admin AND that admin is this user → return
  //    { error: 'ხარ ერთადერთი ადმინი — გადაეცი როლი სხვას ან წაშალე ტენანტი' }
  // 4. UPDATE tenant_memberships SET is_active = false WHERE user_id = ...
  // 5. UPDATE users SET deleted_at = now(), email = 'deleted-<uuid>@trackpro.deleted'
  //    (the email rewrite is so the next signup with the same address works)
  // 6. supabase.auth.signOut()
  // 7. redirect('/login?deleted=1') — login page shows a confirmation banner
  //
  // Wrap auth + DB calls. On error: reportServerActionError(err, {
  //   action: 'delete-account', userId: user.id
  // }) and return { error }.
}
```

Important: we **do not** delete the auth user via the admin API from a server
action (no service-role key in the public app). Soft-delete via the columns
above is enough — the user can no longer log in because the membership is
inactive and the middleware will boot them.

> If `users.deleted_at` does not exist, add a migration:
> `supabase/migrations/<date>_users_deleted_at.sql` with `ALTER TABLE users ADD COLUMN deleted_at timestamptz`. Update the RLS read policy to filter out
> rows where `deleted_at IS NOT NULL`.

### `apps/web/components/settings/DangerZoneCard.tsx` (new, client)
- Red-bordered card at the bottom of `/settings`.
- Heading: "სახიფათო ზონა".
- Body explains the action is irreversible + 30-day retention applies per privacy policy.
- Primary button "ანგარიშის წაშლა" opens a confirmation modal.

### `apps/web/components/settings/DeleteAccountDialog.tsx` (new, client)
- Modal with:
  - Warning text (irreversible, 30-day retention)
  - Read-only display of current email
  - Input asking user to type that email again
  - Submit button disabled until the input string-matches
  - On submit → calls `deleteMyAccount` via a form action
  - Shows server `error` string if returned

### Modify `apps/web/app/(app)/settings/page.tsx`
Render `<DangerZoneCard />` as the last section. Pass the user's email + a
pre-computed `isSoleAdmin: boolean` so the card can swap copy when the user is
blocked from deleting (show greyed button + inline explanation).

### Modify `apps/web/app/(auth)/login/page.tsx`
If `searchParams.deleted === '1'`, render a one-line green banner above the
form: "ანგარიში წაიშალა. მონაცემები 30 დღეში სრულად წაიშლება."

## Acceptance criteria
- [ ] `/settings` has a danger-zone card at the bottom
- [ ] Sole-admin case: button is disabled with inline explanation
- [ ] Non-sole-admin case: button opens confirmation dialog
- [ ] Submit blocked until email string matches
- [ ] On success: memberships flipped inactive, user row soft-deleted, session signed out, redirect to `/login?deleted=1`
- [ ] `/login?deleted=1` shows a green confirmation banner
- [ ] Sentry capture on auth + DB failures via `reportServerActionError`
- [ ] typecheck + build pass

## DO NOT
- ❌ Hard-delete the user from `auth.users` — that needs a service-role key and an Edge Function, out of scope
- ❌ Cascade-delete the user's shifts, location_pings, etc. — those stay for the 30-day window
- ❌ Add a "restore my account" flow — out of scope for v1
- ❌ Touch the existing Sole-Admin transfer flow (there isn't one yet) — keep all transfer logic out of this PR

## Commit
```powershell
git add apps/web/app/'(app)'/settings apps/web/app/'(auth)'/login apps/web/components/settings supabase/migrations
git commit -m "feat(settings): self-serve account deletion with safety checks"
```

## Estimated effort
**~6-8 hours** of Codex work.
