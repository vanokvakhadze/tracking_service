# Stripe Activation Playbook

Last checked against code: 2026-05-21.

This document is the operational checklist for turning Stripe billing on. The
current repository has Stripe code, but the live `/billing` UI is still
preview-only until [task.045](codex/task.045.md) is executed.

## Code Reality

| Area | Current source of truth |
| --- | --- |
| Preview billing page | `apps/web/app/(app)/billing/page.tsx` reads `subscription_plans` and renders disabled plan cards. |
| Checkout action | `apps/web/app/(app)/billing/checkout-action.ts` creates subscription Checkout Sessions, but the current UI does not submit it. |
| Customer portal | `apps/web/app/api/stripe/portal/route.ts` creates Stripe Billing Portal sessions after a tenant has `stripe_customer_id`. |
| Stripe SDK | `apps/web/lib/stripe/server.ts` reads `STRIPE_SECRET_KEY` and `STRIPE_PRICE_BASIC/PRO/ENTERPRISE`. |
| Webhook | `supabase/functions/stripe-webhook/index.ts` is a Supabase Edge Function, not a Next.js route. |

Do not document or configure `apps/web/app/api/webhooks/stripe/route.ts`; that
route does not exist.

## Plans And Price IDs

The app plan codes are `basic`, `pro`, and `enterprise`. Display prices come
from `public.subscription_plans`, seeded in
`tasks/reference/tracking_saas_schema.sql` as:

| Plan code | Display price |
| --- | --- |
| `basic` | 5 GEL per user/month |
| `pro` | 12 GEL per user/month |
| `enterprise` | 25 GEL per user/month |

In Stripe, create matching recurring monthly prices. For every environment,
set each `STRIPE_PRICE_*` value to the matching price ID from the Stripe
Dashboard. Replace placeholder values with the live price ID from Stripe
Dashboard; never commit real `price_...`, `sk_...`, `pk_...`, or `whsec_...`
values.

## Web App Env

Local development uses `apps/web/.env.local`; production/staging uses Vercel
environment variables.

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PRICE_BASIC=replace-with-test-price-id-from-stripe-dashboard
STRIPE_PRICE_PRO=replace-with-test-price-id-from-stripe-dashboard
STRIPE_PRICE_ENTERPRISE=replace-with-test-price-id-from-stripe-dashboard
```

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is still present in
`apps/web/.env.example` and [task.045](codex/task.045.md). The current checkout
implementation redirects through a server action and does not read the
publishable key directly.

## Checkout Behavior

`createCheckoutSession`:

- validates `plan` as `basic`, `pro`, or `enterprise`;
- requires an authenticated active `tenant_admin` or `super_admin`;
- creates or reuses a Stripe customer and stores `tenants.stripe_customer_id`;
- counts active tenant memberships and uses that count as the per-seat
  quantity;
- creates a Stripe subscription Checkout Session;
- uses `${NEXT_PUBLIC_APP_URL}/billing?success=true` as the success URL;
- uses `${NEXT_PUBLIC_APP_URL}/billing?canceled=true` as the cancel URL;
- writes `tenant_id` and `plan_code` into `subscription_data.metadata`.

Until [task.045](codex/task.045.md) lands, `/billing` will not expose checkout
buttons.

## Webhook Deployment

Deploy the Supabase Edge Function:

```powershell
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

The `--no-verify-jwt` flag is required because Stripe calls the function.
Stripe signature validation is handled with `STRIPE_WEBHOOK_SECRET`.

Set these Supabase Edge Function secrets:

```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase.

Register this endpoint in Stripe:

```text
https://<project-ref>.supabase.co/functions/v1/stripe-webhook
```

Subscribe to exactly these events, which the Edge Function handles:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.trial_will_end`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.payment_succeeded`

## Test Mode Checklist

1. Create Stripe test-mode products and recurring monthly prices for Basic,
   Pro, and Enterprise.
2. Copy the test-mode price IDs into the web app env vars.
3. Deploy `stripe-webhook` and set test-mode Edge Function secrets.
4. Register the Supabase Edge Function webhook URL in Stripe test mode.
5. Run the web app and complete [task.045](codex/task.045.md) so the live
   billing UI is enabled.
6. As an admin, open `/billing`, choose a plan, and pay with Stripe test card
   `4242 4242 4242 4242`.
7. Confirm the return URL is `/billing?success=true`.
8. Confirm `public.tenants.subscription_status`, `plan_code`,
   `stripe_customer_id`, `stripe_subscription_id`, `subscription_quantity`, and
   `current_period_end` update from webhook delivery.

If tenant billing columns do not update, check Stripe Dashboard -> Developers
-> Webhooks -> Recent deliveries first.

## Live Activation Checklist

1. Activate live payments in Stripe and complete business verification.
2. Recreate the same Basic, Pro, and Enterprise recurring prices in live mode.
   Test-mode prices do not carry into live mode.
3. Replace Vercel `STRIPE_SECRET_KEY` and `STRIPE_PRICE_*` values with live
   values from the Stripe Dashboard.
4. Create a live-mode webhook endpoint for the same Supabase Function URL.
5. Replace Supabase Edge Function `STRIPE_SECRET_KEY` and
   `STRIPE_WEBHOOK_SECRET` with live-mode values.
6. Redeploy the web app after env changes.
7. Make one small real payment, confirm the tenant updates, then refund it from
   the Stripe Dashboard.

## Common Failure Checks

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Stripe price id for plan ... is not configured` | Missing `STRIPE_PRICE_*` env var | Copy the matching price ID from Stripe Dashboard. |
| Webhook returns 400 | Wrong webhook signing secret | Re-copy `whsec_...` from the same Stripe endpoint. |
| Tenant is not updated after successful payment | Webhook event missing or failed | Check Stripe recent deliveries and selected event list. |
| Checkout opens but plan is wrong | Price ID does not match plan code | Re-map `STRIPE_PRICE_BASIC/PRO/ENTERPRISE`. |
| Billing portal returns 400 | Tenant has no `stripe_customer_id` yet | Complete one Checkout Session first. |

## Related Docs

- [task.045](codex/task.045.md) - code task that activates billing UI.
- [supabase/functions/stripe-webhook/README.md](../supabase/functions/stripe-webhook/README.md) - Edge Function deploy notes.
- [REMAINING_WORK.md](REMAINING_WORK.md) - launch blockers and open operations.
