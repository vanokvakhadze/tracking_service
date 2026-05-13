import Stripe from 'stripe'

const secret = process.env.STRIPE_SECRET_KEY
if (!secret && process.env.NODE_ENV !== 'production') {
  // Don't crash dev when the key is missing — just emit a clear hint. The
  // first checkout call will throw with a typed error.
  console.warn('[stripe] STRIPE_SECRET_KEY is not set; checkout flows will fail.')
}

export const stripe = new Stripe(secret ?? 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
  appInfo: {
    name: 'trackpro-web',
    version: '0.1.0',
  },
})

export type PlanCode = 'basic' | 'pro' | 'enterprise'

/** Map our subscription_plans.code → Stripe price id (env-driven). */
export function priceIdForPlan(plan: PlanCode): string {
  const map: Record<PlanCode, string | undefined> = {
    basic: process.env.STRIPE_PRICE_BASIC,
    pro: process.env.STRIPE_PRICE_PRO,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  }
  const id = map[plan]
  if (!id) {
    throw new Error(`Stripe price id for plan "${plan}" is not configured`)
  }
  return id
}
