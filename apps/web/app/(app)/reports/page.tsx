import { AlertTriangle, Clock, MapPin, Route } from 'lucide-react'
import { redirect } from 'next/navigation'
import { SubHeader } from '@/components/layout/SubHeader'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/reports/MetricCard'
import { getCurrentUser } from '@/lib/auth/actions'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const myActive = me.memberships?.find((m) => m.is_active)
  if (!myActive || !['tenant_admin', 'super_admin'].includes(myActive.role)) {
    return (
      <>
        <SubHeader title="რეპორტები" />
        <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
          ამ გვერდზე წვდომა მხოლოდ admin-ს აქვს.
        </main>
      </>
    )
  }

  return (
    <>
      <SubHeader
        title="რეპორტები"
        subtitle="ბოლო 30 დღე"
        actions={
          <>
            <DateRangeStub />
            <Button variant="secondary">CSV ექსპორტი</Button>
          </>
        }
      />

      <main className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="აქტიური ცვლები" value="—" icon={Clock} tone="accent" />
          <MetricCard label="ჯამური მანძილი" value="—" delta="კმ" icon={Route} tone="success" />
          <MetricCard label="ვიზიტი ლოკაციებზე" value="—" icon={MapPin} tone="accent" />
          <MetricCard label="გაფრთხილებები" value="—" icon={AlertTriangle} tone="warning" />
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
            <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              საათები თანამშრომელზე
            </h2>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">ბოლო 30 დღე</p>
          </div>
          <div className="p-12 text-center">
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              ჯერ მონაცემები არ არის.
            </p>
            <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
              ჩარტი ჩაერთვის როცა Phase 3-ში mobile app ცვლებს იწყებს.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
            <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              ყველაზე მონახულებული ლოკაციები
            </h2>
          </div>
          <div className="p-12 text-center">
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              ჯერ ვიზიტი არ ფიქსირდება.
            </p>
            <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
              შექმენი ლოკაცია → თანამშრომელმა მოინახულე → აქ გამოჩნდება.
            </p>
          </div>
        </div>
      </main>
    </>
  )
}

function DateRangeStub() {
  return (
    <button
      type="button"
      className="inline-flex h-8 items-center gap-2 rounded-[6px] border border-[var(--color-border)] bg-white px-3 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
    >
      <Clock className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
      ბოლო 30 დღე
    </button>
  )
}
