import { Activity, Clock, TrendingUp, Users } from 'lucide-react'
import type { UsersStats } from './types'

interface UserStatStripProps {
  stats: UsersStats
}

const cards = [
  {
    key: 'total',
    label: 'ჯამური',
    sub: 'თანამშრომელი',
    icon: Users,
    iconClass: 'bg-[var(--color-accent-tint)] text-[var(--color-accent)]',
  },
  {
    key: 'active',
    label: 'აქტიური',
    sub: 'ახლა ჩართული',
    icon: Activity,
    iconClass: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
  },
  {
    key: 'averageProductivity',
    label: 'საშ. პროდუქტიულობა',
    sub: 'ბოლო 7 დღე',
    icon: TrendingUp,
    iconClass: 'bg-[var(--color-info-bg)] text-[var(--color-info-text)]',
    suffix: '%',
  },
  {
    key: 'pendingInvites',
    label: 'მოლოდინში',
    sub: 'მოწვევა',
    icon: Clock,
    iconClass: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]',
  },
] as const

export function UserStatStrip({ stats }: UserStatStripProps) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        const value = stats[card.key]
        return (
          <article
            className="flex items-center gap-3 rounded-[8px] border border-[var(--color-border)] bg-white p-4"
            key={card.key}
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-[8px] ${card.iconClass}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--color-text-tertiary)]">
                {card.label}
              </p>
              <p className="text-[22px] font-bold leading-tight text-[var(--color-text-primary)]">
                {value}
                {'suffix' in card ? card.suffix : ''}
              </p>
              <p className="text-[11px] text-[var(--color-text-secondary)]">{card.sub}</p>
            </div>
          </article>
        )
      })}
    </section>
  )
}
