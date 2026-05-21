'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export type ReportRange = 'today' | '7d' | '30d' | '90d'
export type ReportTeam = 'all' | 'tbilisi' | 'batumi' | 'kutaisi'

interface RangeFilterProps {
  range: ReportRange
  team: ReportTeam
}

const ranges: { key: ReportRange; label: string }[] = [
  { key: 'today', label: 'დღეს' },
  { key: '7d', label: '7დ' },
  { key: '30d', label: '30დ' },
  { key: '90d', label: '90დ' },
]

const teams: { key: ReportTeam; label: string }[] = [
  { key: 'all', label: 'ყველა' },
  { key: 'tbilisi', label: 'თბილისი' },
  { key: 'batumi', label: 'ბათუმი' },
  { key: 'kutaisi', label: 'ქუთაისი' },
]

export function RangeFilter({ range, team }: RangeFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function update(next: Partial<{ range: ReportRange; team: ReportTeam }>) {
    const params = new URLSearchParams(searchParams.toString())
    if (next.range) params.set('range', next.range)
    if (next.team) params.set('team', next.team)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-[8px] bg-[var(--color-surface-2)] p-1">
        {ranges.map((item) => (
          <button
            className={
              item.key === range
                ? 'h-7 rounded-[6px] bg-white px-3 text-[12px] font-semibold text-[var(--color-text-primary)]'
                : 'h-7 rounded-[6px] px-3 text-[12px] font-semibold text-[var(--color-text-secondary)] hover:bg-white/70'
            }
            key={item.key}
            onClick={() => update({ range: item.key })}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {teams.map((item) => (
          <button
            className={
              item.key === team
                ? 'inline-flex h-7 items-center rounded-full bg-[var(--color-accent)] px-3 text-[12px] font-semibold text-white'
                : 'inline-flex h-7 items-center rounded-full border border-[var(--color-border)] bg-white px-3 text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
            }
            key={item.key}
            onClick={() => update({ team: item.key })}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
