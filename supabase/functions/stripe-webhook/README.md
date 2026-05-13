# stripe-webhook Edge Function

Receives Stripe webhook events and updates `public.tenants` subscription state. Runs with the service-role key (RLS bypassed) — the only path that mutates billing columns.

## Deploy

```bash
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

> `--no-verify-jwt` is required: Stripe is the caller, not a Supabase user, so JWT verification must be off. Signature is instead checked with `STRIPE_WEBHOOK_SECRET`.

## Set env vars

In Supabase Dashboard → **Edge Functions → stripe-webhook → Settings → Secrets**:

| Key | Value |
|---|---|
| `STRIPE_SECRET_KEY` | from Stripe Dashboard → Developers → API keys (use test key for staging) |
| `STRIPE_WEBHOOK_SECRET` | from the webhook endpoint you create in Stripe (see below) |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected.

## Register webhook in Stripe

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
3. Events to send (5):
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
4. Copy the **signing secret** (`whsec_...`) and paste it as `STRIPE_WEBHOOK_SECRET` above.

## Local testing

```bash
# 1. Forward Stripe events to the local function
npx supabase functions serve stripe-webhook --no-verify-jwt

# 2. In another terminal, use Stripe CLI to relay events
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
# Copy the printed whsec_... and set it as STRIPE_WEBHOOK_SECRET locally.
```
