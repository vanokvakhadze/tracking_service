import { SubHeader } from '@/components/layout/SubHeader'
import { ExportButton } from '@/components/reports/ExportButton'
import { MetricCard } from '@/components/reports/MetricCard'
import { ShiftsTable } from '@/components/reports/ShiftsTable'
import { getCurrentUser } from '@/lib/auth/actions'
import { AlertTriangle, Clock, MapPin, Route } from 'lucide-react'
import { redirect } from 'next/navigation'

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
            <ExportButton />
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

        <ShiftsTable tenantId={myActive.tenant?.id ?? ''} canAnnotate />
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
