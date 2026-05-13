import { redirect } from 'next/navigation'
import { SubHeader } from '@/components/layout/SubHeader'
import { BillingPortalCard } from '@/components/billing/BillingPortalCard'
import { CurrentPlanCard } from '@/components/billing/CurrentPlanCard'
import { TrialBanner } from '@/components/billing/TrialBanner'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface BillingPageProps {
  searchParams: Promise<{ success?: string; canceled?: string }>
}

interface TenantBillingRow {
  id: string
  name: string
  plan_code: string | null
  subscription_status: string | null
  subscription_quantity: number | null
  current_period_end: string | null
  trial_ends_at: string | null
}

interface PlanLookupRow {
  code: string
  name: string
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const membership = me.memberships?.find((m) => m.is_active)
  const tenantId = membership?.tenant?.id
  const isAdmin = membership && ['tenant_admin', 'super_admin'].includes(membership.role)
  const params = await searchParams

  if (!tenantId) {
    return (
      <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
        აქტიური workspace ვერ მოიძებნა.
      </main>
    )
  }
  if (!isAdmin) {
    return (
      <>
        <SubHeader title="გადახდები" />
        <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
          ბილინგის გვერდი მხოლოდ admin-ისთვისაა.
        </main>
      </>
    )
  }

  const supabase = await createClient()
  const [{ data: tenant }, { data: plans }] = await Promise.all([
    supabase
      .from('tenants')
      .select(
        'id, name, plan_code, subscription_status, subscription_quantity, current_period_end, trial_ends_at',
      )
      .eq('id', tenantId)
      .single()
      .overrideTypes<TenantBillingRow, { merge: false }>(),
    supabase
      .from('subscription_plans')
      .select('code, name')
      .overrideTypes<PlanLookupRow[], { merge: false }>(),
  ])

  if (!tenant) {
    return (
      <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
        Tenant ვერ მოიძებნა.
      </main>
    )
  }

  const planName = (plans ?? []).find((p) => p.code === tenant.plan_code)?.name ?? null

  return (
    <>
      <SubHeader title="გადახდები" subtitle="გეგმის შეცვლა, გადახდის მეთოდი, ანგარიშები" />
      <main className="p-6 space-y-4">
        {params.success && (
          <Banner tone="success" text="გადახდა წარმატებით — სუბსკრიფცია გააქტიურდა." />
        )}
        {params.canceled && (
          <Banner tone="warning" text="გადახდა გაუქმდა. შეგიძლია ხელახლა სცადო ნებისმიერ დროს." />
        )}

        <CurrentPlanCard
          planCode={tenant.plan_code}
          planName={planName}
          status={tenant.subscription_status}
          quantity={tenant.subscription_quantity ?? 1}
          currentPeriodEnd={tenant.current_period_end}
          trialEndsAt={tenant.trial_ends_at}
        />

        <BillingPortalCard />
        <TrialBanner status={tenant.subscription_status} trialEndsAt={tenant.trial_ends_at} />
      </main>
    </>
  )
}

function Banner({ tone, text }: { tone: 'success' | 'warning'; text: string }) {
  const classes =
    tone === 'success'
      ? 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
      : 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'
  return <div className={`rounded-md border px-4 py-3 text-[13px] ${classes}`}>{text}</div>
}
