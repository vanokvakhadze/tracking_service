import { type TenantRow, TenantsTable } from '@/components/platform/TenantsTable'
import { MetricCard } from '@/components/reports/MetricCard'
import { createClient } from '@/lib/supabase/server'
import { Building2, DollarSign, TrendingUp, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PlanLookupRow {
  code: string
  price_per_user: number | null
}

export default async function PlatformOverviewPage() {
  const supabase = await createClient()
  const [{ data: tenants }, { data: plans }, { count: totalUsers }] = await Promise.all([
    supabase
      .from('tenants')
      .select(
        'id, name, subdomain, status, plan_code, subscription_status, subscription_quantity, current_period_end, trial_ends_at, created_at',
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .overrideTypes<TenantRow[], { merge: false }>(),
    supabase
      .from('subscription_plans')
      .select('code, price_per_user')
      .overrideTypes<PlanLookupRow[], { merge: false }>(),
    supabase.from('users').select('id', { count: 'exact', head: true }).is('deleted_at', null),
  ])

  const planPriceByCode = new Map((plans ?? []).map((p) => [p.code, Number(p.price_per_user ?? 0)]))

  const list = tenants ?? []
  const activeTenants = list.filter((t) => t.subscription_status === 'active').length
  const trialingTenants = list.filter((t) => t.subscription_status === 'trialing').length
  const totalMrr = list.reduce((sum, t) => {
    if (t.subscription_status !== 'active') return sum
    const price = planPriceByCode.get(t.plan_code ?? '') ?? 0
    return sum + price * (t.subscription_quantity ?? 0)
  }, 0)

  const allCount = list.length || 1 // avoid /0
  const conversionPct = Math.round((activeTenants / allCount || 0) * 100)

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-[24px] font-bold tracking-tight text-[var(--color-text-primary)]">
          Platform overview
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
          Sazeo platform — ყველა tenant ერთად.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="MRR"
          value={`${totalMrr.toFixed(0)} GEL`}
          delta={`${activeTenants} active tenant`}
          icon={DollarSign}
          tone="success"
        />
        <MetricCard
          label="Tenants"
          value={String(list.length)}
          delta={`${trialingTenants} trial · ${activeTenants} active`}
          icon={Building2}
          tone="accent"
        />
        <MetricCard label="Users" value={String(totalUsers ?? 0)} icon={Users} tone="accent" />
        <MetricCard
          label="Trial → paid"
          value={`${conversionPct}%`}
          icon={TrendingUp}
          tone="warning"
        />
      </div>

      <TenantsTable rows={list} planPriceByCode={planPriceByCode} />
    </div>
  )
}
