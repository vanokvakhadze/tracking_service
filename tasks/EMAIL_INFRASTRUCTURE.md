# Email Infrastructure

Last checked against code: 2026-05-21.

TrackPro currently uses Resend for transactional invite emails. The invite
record is the source of truth; email delivery is best-effort and must not block
invitation creation.

## Current Code Paths

| Area | Source |
| --- | --- |
| Resend sender | `apps/web/lib/email/send-invite-email.ts` |
| Single invite action | `apps/web/app/(app)/users/invite-action.ts` |
| Bulk CSV invite action | `apps/web/app/(app)/users/bulk-invite-action.ts` |
| Alert-email placeholder | `supabase/functions/geofence-event/index.ts` |

## Env Vars

Set these in Vercel for the web app:

```env
RESEND_API_KEY=re_xxx
EMAIL_FROM=TrackPro <noreply@trackpro.ge>
```

`EMAIL_FROM` is optional in code. If it is missing, invite emails default to
`TrackPro <onboarding@resend.dev>`, which is useful for early testing but not
acceptable for production.

If Edge Function alert email delivery is enabled, also set `RESEND_API_KEY` in
Supabase Edge Function secrets for `geofence-event`.

## Invite Email Behavior

`sendInviteEmail` sends a direct HTTPS request to
`https://api.resend.com/emails`. It builds both:

- HTML email body with escaped user/company fields;
- plain-text fallback body.

The payload includes:

- recipient email;
- invite URL;
- company name;
- inviter name when available;
- role label for `user`, `manager`, or `tenant_admin`;
- expiration date.

## Graceful Degrade Contract

When `RESEND_API_KEY` is missing:

- `sendInviteEmail` logs `[invite-email] skipped ...`;
- it returns `{ sent: false, reason: 'no_api_key' }`;
- the invitation row still exists;
- the invite URL is still returned by the single-invite action.

When Resend returns an error or the network request fails:

- the error is logged;
- the result is `{ sent: false, reason: 'resend_<status>' }` or
  `{ sent: false, reason: 'network_error' }`;
- invitation creation still succeeds.

UI copy must reflect this. It is safe to say "Invitation created" when the DB
insert succeeds. Only say "Email sent" when the action result confirms
`emailSent: true`. If email is not configured, show or expose the invite URL
instead of implying delivery.

Bulk invites currently count a row as successful after the invitation row is
created and the email attempt completes, regardless of the email result. The UI
should treat bulk email delivery as best-effort unless per-row delivery status
is added later.

## Resend Domain Setup

For production:

1. In Resend, add `trackpro.ge` or a mail subdomain such as
   `mail.trackpro.ge`.
2. Add the DNS records Resend provides for SPF/DKIM verification.
3. Wait for Resend to show the domain as verified.
4. Set `EMAIL_FROM` to a verified sender, for example
   `TrackPro <noreply@trackpro.ge>`.
5. Send a real invite to an internal address and verify inbox placement,
   reply-to expectations, and spam-folder behavior.

Do not keep `onboarding@resend.dev` in production.

## Production Checklist

- [ ] `RESEND_API_KEY` set in Vercel production and preview environments.
- [ ] `EMAIL_FROM` uses a verified domain sender.
- [ ] SPF/DKIM records verified in Resend.
- [ ] Single invite shows "email sent" only when `emailSent` is true.
- [ ] Single invite exposes or logs the invite URL when delivery is skipped.
- [ ] Bulk invite UI avoids claiming every email was delivered.
- [ ] Resend dashboard checked for bounces and delivery failures after launch.
- [ ] Supabase `geofence-event` has `RESEND_API_KEY` only if alert-email
  delivery is intentionally enabled.

## Related Docs

- [README.md](../README.md) - env var overview.
- [REMAINING_WORK.md](REMAINING_WORK.md) - launch checklist.
