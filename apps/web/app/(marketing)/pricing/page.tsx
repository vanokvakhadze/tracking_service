import { Check } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface PlanFeatures {
  reports?: boolean
  api?: boolean
  white_label?: boolean
  sla?: boolean
}

interface PlanRow {
  code: string
  name: string
  max_users: number | null
  max_locations: number | null
  price_per_user: number | null
  currency: string | null
  features: PlanFeatures | null
  is_active: boolean | null
}

const FEATURE_LABELS = {
  reports: 'რეპორტები',
  api: 'API წვდომა',
  white_label: 'საკუთარი ბრენდი',
  sla: '24/7 SLA',
} as const

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('code, name, max_users, max_locations, price_per_user, currency, features, is_active')
    .eq('is_active', true)
    .order('price_per_user', { ascending: true })
    .overrideTypes<PlanRow[], { merge: false }>()

  const visible = (plans ?? []).filter((p) => p.code !== 'free')

  return (
    <main className="px-4 py-16">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-[36px] font-bold tracking-tight text-[var(--color-text-primary)]">
          მარტივი ფასები
        </h1>
        <p className="mt-3 text-[15px] text-[var(--color-text-secondary)]">
          გადახდე მხოლოდ აქტიური თანამშრომლისთვის. 14 დღიანი უფასო ცდა — ბარათი არ მოითხოვება.
        </p>
      </header>

      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {visible.map((plan) => (
          <PricingCard key={plan.code} plan={plan} recommended={plan.code === 'pro'} />
        ))}
      </div>

      <FeatureMatrix plans={visible} />

      <footer className="mx-auto mt-16 max-w-2xl text-center text-[12px] text-[var(--color-text-tertiary)]">
        ფასები მოცემულია GEL-ში, თვეში თითო თანამშრომელზე. ცვლის ბრუნი ცვლის რაოდენობას Stripe-ში
        ავტომატურად. გადახდის მიმწოდებელი — Stripe (PCI-DSS Level 1).
      </footer>
    </main>
  )
}

function PricingCard({ plan, recommended }: { plan: PlanRow; recommended: boolean }) {
  const features = plan.features ?? {}
  const ctaLabel = plan.code === 'enterprise' ? 'დაგვიკავშირდი' : 'დაიწყე უფასოდ'
  const ctaHref = '/signup'

  return (
    <div
      className={
        recommended
          ? 'relative rounded-[12px] border-2 border-[var(--color-accent)] bg-white p-6 shadow-sm'
          : 'rounded-[12px] border border-[var(--color-border)] bg-white p-6'
      }
    >
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-accent)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent-fg)]">
          რეკომენდებული
        </span>
      )}
      <h2 className="text-[18px] font-bold text-[var(--color-text-primary)]">{plan.name}</h2>
      <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
        {plan.max_users === null ? 'შეუზღუდავი მომხმარებელი' : `${plan.max_users} მომხმარებლამდე`}
        {plan.max_locations !== null && ` · ${plan.max_locations} ლოკაცია`}
      </p>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-[36px] font-bold text-[var(--color-text-primary)] tabular-nums">
          {plan.price_per_user?.toFixed(2) ?? '0.00'}
        </span>
        <span className="text-[13px] text-[var(--color-text-secondary)]">
          {plan.currency ?? 'GEL'} / თანამშრომელი / თვე
        </span>
      </div>

      <ul className="mt-6 space-y-2.5 text-[13px]">
        <FeatureRow
          on
          label={`${plan.max_users === null ? 'შეუზღუდავი' : `${plan.max_users}+`} თანამშრომელი`}
        />
        <FeatureRow on label="GPS ცვლების ავტოტრეკინგი" />
        <FeatureRow on label="გეოფენსები + hysteresis" />
        <FeatureRow on={Boolean(features.reports)} label="რეპორტები + ექსპორტი" />
        <FeatureRow on={Boolean(features.api)} label="REST API + Webhooks" />
        <FeatureRow on={Boolean(features.white_label)} label="საკუთარი ბრენდი (white-label)" />
        <FeatureRow on={Boolean(features.sla)} label="24/7 პრიორიტეტული SLA" />
      </ul>

      <Link
        href={ctaHref}
        className={
          recommended
            ? 'mt-6 block rounded-[8px] bg-[var(--color-accent)] py-3 text-center text-[14px] font-semibold text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]'
            : 'mt-6 block rounded-[8px] border border-[var(--color-border)] bg-white py-3 text-center text-[14px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
        }
      >
        {ctaLabel}
      </Link>
    </div>
  )
}

function FeatureRow({ on, label }: { on: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2">
      <Check
        className={
          on
            ? 'mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]'
            : 'mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] opacity-40'
        }
      />
      <span
        className={
          on ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)] line-through'
        }
      >
        {label}
      </span>
    </li>
  )
}

function FeatureMatrix({ plans }: { plans: PlanRow[] }) {
  if (plans.length === 0) return null
  return (
    <section className="mx-auto mt-16 max-w-5xl">
      <h2 className="mb-6 text-[20px] font-bold text-[var(--color-text-primary)]">
        ფიჩერების შედარება
      </h2>
      <div className="overflow-x-auto rounded-[10px] border border-[var(--color-border)] bg-white">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                ფიჩერი
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.code}
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]"
                >
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(Object.entries(FEATURE_LABELS) as [keyof PlanFeatures, string][]).map(
              ([feature, label]) => (
                <tr key={feature} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-4 py-3 text-[var(--color-text-primary)]">{label}</td>
                  {plans.map((plan) => (
                    <td key={plan.code} className="px-4 py-3">
                      {plan.features?.[feature] ? (
                        <Check className="h-4 w-4 text-[var(--color-success)]" />
                      ) : (
                        <span className="text-[var(--color-text-tertiary)]">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
