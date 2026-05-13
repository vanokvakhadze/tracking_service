// Supabase Edge Function: stripe-webhook
//
// Receives Stripe webhook events and syncs the relevant subscription state
// back into public.tenants. Runs with the service-role key (RLS bypassed)
// because the client must never be able to mutate billing state directly.
//
// Required env vars (set in Supabase Dashboard → Edge Functions → settings):
//   - STRIPE_SECRET_KEY
//   - STRIPE_WEBHOOK_SECRET
//   - SUPABASE_URL (auto-set by Supabase)
//   - SUPABASE_SERVICE_ROLE_KEY (auto-set by Supabase)
//
// Deploy with: `supabase functions deploy stripe-webhook --no-verify-jwt`
// (the --no-verify-jwt flag is critical — Stripe is the caller, not a user.)
//
// In the Stripe Dashboard register the webhook URL as:
//   https://<project>.supabase.co/functions/v1/stripe-webhook
// Subscribe to events:
//   customer.subscription.created
//   customer.subscription.updated
//   customer.subscription.deleted
//   invoice.payment_failed
//   invoice.payment_succeeded

import { createClient } from 'jsr:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17'

const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY')
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!STRIPE_SECRET || !WEBHOOK_SECRET || !SUPABASE_URL || !SERVICE_ROLE) {
  console.error('[stripe-webhook] missing one or more required env vars')
}

const stripe = new Stripe(STRIPE_SECRET ?? '', {
  apiVersion: '2025-02-24.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(SUPABASE_URL ?? '', SERVICE_ROLE ?? '', {
  auth: { persistSession: false },
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req: Request): Promise<Response> => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      WEBHOOK_SECRET ?? '',
      undefined,
      cryptoProvider,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.warn('[stripe-webhook] signature check failed:', message)
    return new Response(`Invalid signature: ${message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription
        await syncSubscription(sub)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await markCanceled(sub)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await markPastDue(invoice)
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const subId =
            typeof invoice.subscription === 'string'
              ? invoice.subscription
              : invoice.subscription.id
          const sub = await stripe.subscriptions.retrieve(subId)
          await syncSubscription(sub)
        }
        break
      }
      default:
        // Ignore unrelated events
        break
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error('[stripe-webhook] handler error:', message)
    return new Response(`Webhook handler failed: ${message}`, { status: 500 })
  }
})

async function syncSubscription(sub: Stripe.Subscription) {
  const tenantId = sub.metadata.tenant_id
  if (!tenantId) {
    console.warn('[stripe-webhook] subscription has no tenant_id metadata; skipping', sub.id)
    return
  }

  const planCode = sub.metadata.plan_code ?? null
  const quantity = sub.items.data[0]?.quantity ?? 1
  const currentPeriodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null

  const { error } = await supabase
    .from('tenants')
    .update({
      stripe_subscription_id: sub.id,
      stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
      subscription_status: sub.status,
      subscription_quantity: quantity,
      current_period_end: currentPeriodEnd,
      plan_code: planCode,
    })
    .eq('id', tenantId)

  if (error) {
    console.error('[stripe-webhook] supabase update failed:', error.message)
    throw error
  }
}

async function markCanceled(sub: Stripe.Subscription) {
  const tenantId = sub.metadata.tenant_id
  if (!tenantId) return
  await supabase
    .from('tenants')
    .update({
      subscription_status: 'canceled',
      current_period_end: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    })
    .eq('id', tenantId)
}

async function markPastDue(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return
  const subId =
    typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id
  const sub = await stripe.subscriptions.retrieve(subId)
  const tenantId = sub.metadata.tenant_id
  if (!tenantId) return
  await supabase.from('tenants').update({ subscription_status: 'past_due' }).eq('id', tenantId)
}
