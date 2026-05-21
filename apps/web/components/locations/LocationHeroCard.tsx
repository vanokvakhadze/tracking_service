'use client'

import { Avatar } from '@/components/ui/Avatar'
import { clsx } from 'clsx'
import {
  BriefcaseBusiness,
  Building2,
  Clock3,
  MapPin,
  MoreHorizontal,
  RadioTower,
  Route,
  Warehouse,
} from 'lucide-react'
import type { LocationCategory, LocationRow } from './types'
import { categoryLabels, statusLabels } from './types'

interface LocationHeroCardProps {
  location: LocationRow
  selected: boolean
  onSelect: (id: string) => void
}

const categoryIcons: Record<LocationCategory, typeof Building2> = {
  office: Building2,
  client_site: BriefcaseBusiness,
  warehouse: Warehouse,
  checkpoint: Route,
  other: MapPin,
}

const categoryBanners: Record<LocationCategory, string> = {
  office:
    'bg-[linear-gradient(135deg,var(--color-accent-hover),var(--color-accent),var(--color-accent-soft))]',
  client_site:
    'bg-[linear-gradient(135deg,var(--color-info-text),var(--color-info),var(--color-accent-soft))]',
  warehouse:
    'bg-[linear-gradient(135deg,var(--color-success-text),var(--color-success),var(--color-success-bg))]',
  checkpoint:
    'bg-[linear-gradient(135deg,var(--color-warning-text),var(--color-warning),var(--color-warning-bg))]',
  other:
    'bg-[linear-gradient(135deg,var(--color-text-secondary),var(--color-text-tertiary),var(--color-surface-2))]',
}

function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

export function LocationHeroCard({ location, selected, onSelect }: LocationHeroCardProps) {
  const category = location.category ?? 'other'
  const Icon = categoryIcons[category]
  const analytics = location.analytics
  const occupancyPct = analytics?.occupancyPct
  const team = analytics?.team ?? []

  return (
    <article
      className={clsx(
        'overflow-hidden rounded-[8px] border bg-white transition-colors',
        selected ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]',
      )}
    >
      <div className={clsx('relative min-h-[112px] p-4 text-white', categoryBanners[category])}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,var(--color-text-primary))] opacity-20" />
        <div className="relative flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
            <Icon className="h-3.5 w-3.5" />
            {categoryLabels[category]}
          </span>
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
            {statusLabels[location.status]}
          </span>
        </div>
        <div className="relative mt-6 min-w-0">
          <h3 className="truncate text-[18px] font-bold">{location.name ?? 'უსახელო ლოკაცია'}</h3>
          <p className="mt-1 line-clamp-1 text-[12px] text-white/85">
            {location.address ?? 'მისამართი არ არის მითითებული'}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[8px] bg-[var(--color-surface)] p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]">
              <RadioTower className="h-3.5 w-3.5" />
              ვიზიტები
            </div>
            <p className="mt-1 text-[18px] font-bold tabular-nums text-[var(--color-text-primary)]">
              {analytics?.visitsToday ?? 0}
            </p>
          </div>
          <div className="rounded-[8px] bg-[var(--color-surface)] p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]">
              <Clock3 className="h-3.5 w-3.5" />
              დაყოვნება
            </div>
            <p className="mt-1 text-[18px] font-bold tabular-nums text-[var(--color-text-primary)]">
              {analytics?.avgDwellMinutes ?? 0}
              <span className="ml-1 text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                წთ
              </span>
            </p>
          </div>
        </div>

        {typeof occupancyPct === 'number' ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="font-medium text-[var(--color-text-tertiary)]">ზონის დატვირთვა</span>
              <span className="font-bold tabular-nums text-[var(--color-text-primary)]">
                {occupancyPct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
              <div
                className="h-full rounded-full bg-[var(--color-success)]"
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center">
            {team.slice(0, 3).map((member, index) => (
              <Avatar
                key={member.id}
                initials={initials(member.name, member.email)}
                seed={member.id}
                size="sm"
                className={clsx(index > 0 && '-ml-2 ring-2 ring-white')}
              />
            ))}
            {team.length === 0 ? (
              <span className="text-[11px] text-[var(--color-text-tertiary)]">
                ზონაში არავინ არის
              </span>
            ) : (
              <span className="ml-2 truncate text-[11px] font-medium text-[var(--color-text-secondary)]">
                {team.length} წევრი ზონაში
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="მენიუ"
            title="მენიუ"
            className="grid h-7 w-7 place-items-center rounded-[6px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <span className="text-[11px] text-[var(--color-text-tertiary)]">
          {location.boundary_radius_m ?? location.radius_m} მ საზღვარი
        </span>
        <button
          type="button"
          onClick={() => onSelect(location.id)}
          className="h-7 rounded-[6px] bg-[var(--color-accent)] px-3 text-[12px] font-semibold text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]"
        >
          დეტალები
        </button>
      </footer>
    </article>
  )
}
