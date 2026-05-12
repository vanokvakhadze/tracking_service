import { Activity, MapPin, Route, Users } from 'lucide-react'
import { SubHeader } from '@/components/layout/SubHeader'
import { MetricCard } from '@/components/reports/MetricCard'
import { getCurrentUser } from '@/lib/auth/actions'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const tenant = user?.memberships?.find((m) => m.is_active)?.tenant

  const now = new Date()
  const formatter = new Intl.DateTimeFormat('ka-GE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const subtitle = `${formatter.format(now)} · განახლება ცოცხლად`

  return (
    <>
      <SubHeader title="ცოცხალი დაშბორდი" subtitle={subtitle} liveLabel="ცოცხალია" />

      <main className="p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="აქტიური ცვლები" value="0 / 0" icon={Activity} tone="accent" />
          <MetricCard label="დღევანდელი მანძილი" value="0 კმ" icon={Route} tone="success" />
          <MetricCard label="ვიზიტი დღეს" value="0" icon={MapPin} tone="accent" />
          <MetricCard label="აქტიური ალერტი" value="0" icon={Users} tone="warning" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
          <div className="rounded-[10px] border border-[var(--color-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
              <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">
                ცოცხალი რუკა
              </h2>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">{tenant?.name ?? ''}</p>
            </div>
            <div className="h-[360px] grid place-items-center text-center px-6">
              <div>
                <p className="text-[13px] text-[var(--color-text-secondary)]">
                  რუკის component ჩაერთვის Mapbox-ის ინტეგრაციით.
                </p>
                <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
                  Phase 2 — Task 2.2-ში
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-[var(--color-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
              <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">
                აქტიური მომხმარებლები
              </h2>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">ნახე ყველა</p>
            </div>
            <div className="h-[360px] grid place-items-center text-center px-6">
              <p className="text-[13px] text-[var(--color-text-secondary)]">
                აქტიური ცვლები არ არის.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
