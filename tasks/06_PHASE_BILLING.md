# Phase 5 — Billing (Week 12)

> **Goal:** Companies pay subscriptions via Stripe.
> **Effort:** ~35 hours
> **Prerequisites:** Phase 1 (tenants table exists).

---

## 🎯 Overview

ბოლოს:
- ✅ 3 ფასი (Basic 5₾ / Pro 12₾ / Enterprise 25₾ per user/month)
- ✅ Per-seat pricing
- ✅ Stripe Checkout
- ✅ Self-service billing portal
- ✅ Trial-to-paid conversion
- ✅ Webhook handles subscription changes
- ✅ Email notifications (Resend)

---

## 📋 Tasks

### Task 5.1 — Create Stripe Products

**Goal:** Setup Stripe products + prices in Dashboard.

**Implementation (Stripe Dashboard):**
1. Login → stripe.com
2. **Currency:** Switch to GEL
3. Products → Create:
   - Name: TrackPro Basic, Price: 5 GEL/seat/month (recurring)
   - Name: TrackPro Pro, Price: 12 GEL/seat/month
   - Name: TrackPro Enterprise, Price: 25 GEL/seat/month
4. Copy price IDs (`price_xxx`) into env vars
5. Enable: Tax (auto-collect), Customer portal, Subscriptions

Add to `.env.local`:
```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_PRICE_BASIC=price_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_ENTERPRISE=price_xxx
```

**Acceptance criteria:**
- [ ] 3 products visible in Stripe Dashboard
- [ ] All prices in GEL
- [ ] Test mode active

**Commit:** N/A (dashboard config)

---

### Task 5.2 — Database Schema for Subscriptions

**Goal:** Add subscription tracking to tenants table.

**Files to create:**
- Supabase migration

**Implementation:**

```sql
alter table public.tenants
  add column stripe_customer_id text unique,
  add column stripe_subscription_id text unique,
  add column subscription_status text default 'trialing'
    check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  add column subscription_quantity integer default 1,
  add column current_period_end timestamptz;

create index idx_tenants_stripe_customer on public.tenants(stripe_customer_id);
create index idx_tenants_subscription_status on public.tenants(subscription_status);
```

**Commit:** `feat(db): add subscription columns to tenants`

---

### Task 5.3 — Pricing Page

**Goal:** Public pricing page (`/pricing`).

**Files to create:**
- `apps/web/app/(marketing)/pricing/page.tsx`

**Acceptance criteria:**
- [ ] 3-column pricing grid
- [ ] Per-seat pricing
- [ ] Pro plan highlighted ("რეკომენდებული")
- [ ] CTA: "დაიწყე trial" → /signup
- [ ] Feature comparison table below

**Commit:** `feat(web): add pricing page`

---

### Task 5.4 — Stripe Checkout Integration

**Goal:** Admin selects plan → Stripe Checkout → returns activated.

**Files to create:**
- `apps/web/lib/stripe/server.ts`
- `apps/web/app/(app)/billing/page.tsx`
- `apps/web/app/(app)/billing/checkout-action.ts`
- `apps/web/app/api/stripe/checkout/route.ts`

**Implementation:**

```typescript
// lib/stripe/server.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

// app/(app)/billing/checkout-action.ts
'use server'

import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const PRICE_IDS = {
  basic: process.env.STRIPE_PRICE_BASIC!,
  pro: process.env.STRIPE_PRICE_PRO!,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
}

export async function createCheckoutSession(plan: 'basic' | 'pro' | 'enterprise') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, tenants(name, stripe_customer_id)')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Count active users for per-seat pricing
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', profile.tenant_id)

  // Create or reuse Stripe customer
  let customerId = profile.tenants?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile.tenants?.name,
      metadata: { tenant_id: profile.tenant_id },
    })
    customerId = customer.id

    await supabase
      .from('tenants')
      .update({ stripe_customer_id: customerId })
      .eq('id', profile.tenant_id)
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      { price: PRICE_IDS[plan], quantity: count || 1 },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    automatic_tax: { enabled: true },
    subscription_data: { metadata: { tenant_id: profile.tenant_id } },
  })

  if (!session.url) throw new Error('No checkout URL')
  redirect(session.url)
}
```

**Acceptance criteria:**
- [ ] Clicking "Upgrade to Pro" → Stripe Checkout opens
- [ ] Successful payment → returns to billing page with success message
- [ ] Customer + subscription saved in DB
- [ ] Per-seat quantity matches user count

**Commit:** `feat(billing): add stripe checkout integration`

---

### Task 5.5 — Stripe Webhook Handler

**Goal:** Update tenant subscription status from Stripe events.

**Files to create:**
- `supabase/functions/stripe-webhook/index.ts`

**Implementation:**

```typescript
// supabase/functions/stripe-webhook/index.ts
import Stripe from 'npm:stripe@17'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('No signature', { status: 400 })

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    return new Response('Invalid signature', { status: 400 })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const tenantId = sub.metadata.tenant_id

      await supabase
        .from('tenants')
        .update({
          stripe_subscription_id: sub.id,
          subscription_status: sub.status,
          subscription_quantity: sub.items.data[0]?.quantity || 1,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq('id', tenantId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const tenantId = sub.metadata.tenant_id

      await supabase
        .from('tenants')
        .update({ subscription_status: 'canceled' })
        .eq('id', tenantId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      // Send email via Resend, mark tenant as past_due
      // ...
      break
    }
  }

  return new Response(JSON.stringify({ received: true }))
})
```

Deploy:
```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

Register webhook in Stripe Dashboard:
- URL: `https://xxx.supabase.co/functions/v1/stripe-webhook`
- Events: `customer.subscription.*`, `invoice.payment_failed`, `invoice.payment_succeeded`

**Acceptance criteria:**
- [ ] Webhook receives Stripe events
- [ ] Subscription status syncs to DB
- [ ] Payment failure triggers email
- [ ] Cancel updates status

**Commit:** `feat(billing): add stripe webhook handler`

---

### Task 5.6 — Billing Page UI

**Goal:** Self-service billing UI.

**Files to create:**
- `apps/web/app/(app)/billing/page.tsx`
- `apps/web/components/billing/CurrentPlanCard.tsx`
- `apps/web/components/billing/InvoiceList.tsx`

**Acceptance criteria:**
- [ ] Current plan info (status, next billing date, seats)
- [ ] Change plan button → Checkout
- [ ] Manage button → Stripe Customer Portal
- [ ] Invoice history list
- [ ] Trial countdown if status=trialing

**Commit:** `feat(billing): add billing page ui`

---

### Task 5.7 — Stripe Customer Portal

**Goal:** Self-service: update card, cancel, change plan.

**Files to create:**
- `apps/web/app/api/stripe/portal/route.ts`

**Implementation:**

```typescript
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('tenants(stripe_customer_id)')
    .eq('id', user.id)
    .single()

  const customerId = profile?.tenants?.stripe_customer_id
  if (!customerId) return NextResponse.json({ error: 'No customer' }, { status: 400 })

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  })

  return NextResponse.json({ url: session.url })
}
```

**Acceptance criteria:**
- [ ] Portal opens in new tab
- [ ] User can update payment method
- [ ] User can cancel subscription
- [ ] Changes sync back via webhook

**Commit:** `feat(billing): add stripe customer portal`

---

### Task 5.8 — Trial Logic + Enforcement

**Goal:** Trial expires → block app access until payment.

**Files to modify:**
- `apps/web/lib/supabase/middleware.ts`

**Implementation:**

```typescript
// In middleware, after auth check:
const { data: profile } = await supabase
  .from('users')
  .select('tenants(subscription_status, trial_ends_at)')
  .eq('id', user.id)
  .single()

const status = profile?.tenants?.subscription_status
const trialExpired = profile?.tenants?.trial_ends_at &&
  new Date(profile.tenants.trial_ends_at) < new Date()

if (status === 'trialing' && trialExpired) {
  if (!pathname.startsWith('/billing')) {
    return NextResponse.redirect(new URL('/billing?trial_expired=true', request.url))
  }
}

if (['canceled', 'unpaid'].includes(status!)) {
  if (!pathname.startsWith('/billing')) {
    return NextResponse.redirect(new URL('/billing?subscription_required=true', request.url))
  }
}
```

**Acceptance criteria:**
- [ ] Trial countdown shown in app (banner)
- [ ] 3 days before expiry → email reminder
- [ ] On expiry → redirect to billing
- [ ] After payment → access restored

**Commit:** `feat(billing): add trial expiry enforcement`

---

### Task 5.9 — Per-Seat Auto-Adjustment

**Goal:** Adding/removing users updates Stripe subscription quantity.

**Files to create:**
- Supabase trigger or function

**Implementation:**

```sql
-- Trigger to update Stripe quantity on user add/remove
create or replace function public.notify_user_count_change()
returns trigger as $$
begin
  -- Call Edge Function to update Stripe
  perform net.http_post(
    url := 'https://xxx.supabase.co/functions/v1/sync-subscription-quantity',
    body := jsonb_build_object('tenant_id', coalesce(NEW.tenant_id, OLD.tenant_id))
  );
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

create trigger user_count_change
  after insert or delete on public.users
  for each row execute function public.notify_user_count_change();
```

Edge function `sync-subscription-quantity` calls Stripe API to update.

**Acceptance criteria:**
- [ ] Adding user → Stripe quantity +1
- [ ] Removing user → Stripe quantity -1
- [ ] Proration applied
- [ ] Tested with Stripe test mode

**Commit:** `feat(billing): add per-seat quantity sync`

---

## ✅ Phase 5 Complete Checklist

- [ ] Pricing page accessible at `/pricing`
- [ ] New signup → 14 day trial
- [ ] Checkout flow completes with test card
- [ ] Webhook syncs subscription state
- [ ] Customer portal works
- [ ] Trial expiry enforces payment
- [ ] Per-seat pricing adjusts automatically
- [ ] Payment failure email sent
- [ ] All tested in Stripe test mode

**🎉 Move to Phase 6: `07_PHASE_SUPER_ADMIN.md`**
