'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { reportServerActionError } from '@/lib/observability/report-error'
import { type PlanCode, priceIdForPlan, stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

const CheckoutSchema = z.object({
  plan: z.enum(['basic', 'pro', 'enterprise']),
})

export async function createCheckoutSession(formData: FormData) {
  const parsed = CheckoutSchema.safeParse({ plan: formData.get('plan') })
  if (!parsed.success) {
    return { error: 'არასწორი ფასი' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Resolve the active tenant + admin role + current customer id
  const { data: profile } = await supabase
    .from('users')
    .select(
      `email,
       memberships:tenant_memberships(
         role, is_active, tenant_id,
         tenant:tenants(id, name, stripe_customer_id)
       )`,
    )
    .eq('id', user.id)
    .single()

  const membership = (profile?.memberships ?? []).find(
    (m) => m.is_active && ['tenant_admin', 'super_admin'].includes(m.role),
  )
  const tenant = Array.isArray(membership?.tenant) ? membership?.tenant[0] : membership?.tenant
  if (!membership || !tenant?.id) {
    return { error: 'მხოლოდ admin-ს შეუძლია ბილინგის მართვა' }
  }

  // Count active members for per-seat quantity
  const { count } = await supabase
    .from('tenant_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
  const quantity = Math.max(1, count ?? 1)

  // Create or reuse the Stripe customer; persist the new id on the tenant
  let customerId = tenant.stripe_customer_id ?? null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? undefined,
      name: tenant.name,
      metadata: { tenant_id: tenant.id },
    })
    customerId = customer.id
    await supabase.from('tenants').update({ stripe_customer_id: customerId }).eq('id', tenant.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const plan = parsed.data.plan as PlanCode

  let session
  try {
    session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceIdForPlan(plan), quantity }],
      success_url: `${appUrl}/billing?success=true`,
      cancel_url: `${appUrl}/billing?canceled=true`,
      automatic_tax: { enabled: true },
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          tenant_id: tenant.id,
          plan_code: plan,
        },
      },
    })
  } catch (stripeError) {
    reportServerActionError(stripeError, {
      action: 'stripe-create-checkout',
      tenantId: tenant.id,
      userId: user.id,
      extra: { plan, quantity },
    })
    return { error: 'Stripe Checkout-ი ვერ შეიქმნა — სცადე მოგვიანებით' }
  }

  if (!session.url) {
    reportServerActionError(new Error('Stripe checkout session missing url'), {
      action: 'stripe-create-checkout',
      tenantId: tenant.id,
      userId: user.id,
      extra: { sessionId: session.id, plan },
    })
    return { error: 'Checkout URL ვერ მოვიდა Stripe-დან' }
  }

  redirect(session.url)
}
