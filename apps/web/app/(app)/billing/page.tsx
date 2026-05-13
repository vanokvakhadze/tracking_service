import { Clock, CreditCard } from 'lucide-react'
import { redirect } from 'next/navigation'
import { SubHeader } from '@/components/layout/SubHeader'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface PlanRow {
  code: string
  name: string
  max_users: number | null
  price_per_user: number | null
  currency: string | null
}

export default async function BillingPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const membership = me.memberships?.find((m) => m.is_active)
  const isAdmin = membership && ['tenant_admin', 'super_admin'].includes(membership.role)

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
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('code, name, max_users, price_per_user, currency')
    .eq('is_active', true)
    .order('price_per_user', { ascending: true })
    .overrideTypes<PlanRow[], { merge: false }>()

  const paid = (plans ?? []).filter((p) => p.code !== 'free')

  return (
    <>
      <SubHeader title="გადახდები" subtitle="ეტაპზე — preview only" />
      <main className="p-6 space-y-6">
        <div className="flex items-start gap-3 rounded-[10px] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-4">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-warning-text)]" />
          <div className="text-[13px] text-[var(--color-warning-text)]">
            <p className="font-semibold">გადახდები მალე ჩაერთვება</p>
            <p className="mt-1">
              Stripe ინტეგრაცია ჯერ არ არის ჩართული. ფასები ქვემოთ მხოლოდ ინფორმაციული ხასიათისაა.
              ცოცხალი გადახდის ფლოუ ცალკე task-ად დარჩა მომავლისთვის (`tasks/codex/task.045.md`).
            </p>
          </div>
        </div>

        <div className="rounded-[10px] border border-[var(--color-border)] bg-white">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
            <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">
              ფასების გეგმები
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
              ცოცხალი არჩევანი ჩაერთვება Stripe-ის გააქტიურების შემდეგ
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-3">
            {paid.map((plan) => (
              <PlanCard key={plan.code} plan={plan} recommended={plan.code === 'pro'} />
            ))}
          </div>
        </div>
      </main>
    </>
  )
}

function PlanCard({ plan, recommended }: { plan: PlanRow; recommended: boolean }) {
  return (
    <div
      className={
        recommended
          ? 'rounded-[8px] border-2 border-[var(--color-accent)] p-4 opacity-90'
          : 'rounded-[8px] border border-[var(--color-border)] p-4 opacity-90'
      }
    >
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {plan.name}
        </p>
        <CreditCard className="h-4 w-4 text-[var(--color-text-tertiary)]" />
      </div>
      <p className="mt-2 text-[20px] font-bold text-[var(--color-text-primary)] tabular-nums">
        {plan.price_per_user?.toFixed(2) ?? '0.00'}
        <span className="ml-1 text-[11px] font-normal text-[var(--color-text-secondary)]">
          {plan.currency ?? 'GEL'}/თვე
        </span>
      </p>
      <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
        {plan.max_users === null ? 'შეუზღუდავი თანამშრომელი' : `${plan.max_users} მომხმარებლამდე`}
      </p>
      <button
        type="button"
        disabled
        className="mt-4 w-full cursor-not-allowed rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 text-[12px] font-medium text-[var(--color-text-tertiary)]"
      >
        მალე
      </button>
    </div>
  )
}
