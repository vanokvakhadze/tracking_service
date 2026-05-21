import { Clock3, MapPin, RadioTower, ShieldAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { LocationStats } from './types'

interface LocationStatStripProps {
  stats: LocationStats
}

interface StatMeta {
  key: keyof LocationStats
  label: string
  icon: LucideIcon
  iconClass: string
  suffix?: string
}

const statMeta: StatMeta[] = [
  {
    key: 'total',
    label: 'ლოკაციები',
    icon: MapPin,
    iconClass: 'bg-[var(--color-accent-tint)] text-[var(--color-accent)]',
  },
  {
    key: 'visitsToday',
    label: 'დღევანდელი ვიზიტები',
    icon: RadioTower,
    iconClass: 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
  },
  {
    key: 'avgDwellMinutes',
    label: 'საშ. დაყოვნება',
    icon: Clock3,
    iconClass: 'bg-[var(--color-info-bg)] text-[var(--color-info-text)]',
    suffix: 'წთ',
  },
  {
    key: 'pending',
    label: 'დასადასტურებელი',
    icon: ShieldAlert,
    iconClass: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]',
  },
]

export function LocationStatStrip({ stats }: LocationStatStripProps) {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {statMeta.map((item) => {
        const Icon = item.icon
        const value = stats[item.key]

        return (
          <article
            key={item.key}
            className="flex items-center gap-3 rounded-[8px] border border-[var(--color-border)] bg-white p-4"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] ${item.iconClass}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[var(--color-text-tertiary)]">
                {item.label}
              </p>
              <p className="mt-0.5 text-[20px] font-bold tabular-nums text-[var(--color-text-primary)]">
                {value}
                {item.suffix ? (
                  <span className="ml-1 text-[12px] font-semibold text-[var(--color-text-tertiary)]">
                    {item.suffix}
                  </span>
                ) : null}
              </p>
            </div>
          </article>
        )
      })}
    </section>
  )
}
