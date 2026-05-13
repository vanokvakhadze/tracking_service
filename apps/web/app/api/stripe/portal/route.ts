import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select(
      `memberships:tenant_memberships(
        role, is_active, tenant_id,
        tenant:tenants(stripe_customer_id)
      )`,
    )
    .eq('id', user.id)
    .single()

  const membership = (profile?.memberships ?? []).find(
    (m) => m.is_active && ['tenant_admin', 'super_admin'].includes(m.role),
  )
  const tenant = Array.isArray(membership?.tenant) ? membership?.tenant[0] : membership?.tenant
  const customerId = tenant?.stripe_customer_id
  if (!customerId) {
    return NextResponse.json(
      { error: 'სუბსკრიფცია ჯერ არ შექმნილა — ჯერ ერთხელ მაინც გადახდის ფანჯარა გახსენი.' },
      { status: 400 },
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/billing`,
  })

  return NextResponse.json({ url: session.url })
}
