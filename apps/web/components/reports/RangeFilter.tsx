'use client'

import { Loader2 } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

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
  const [pending, startTransition] = useTransition()

  function update(next: Partial<{ range: ReportRange; team: ReportTeam }>) {
    const params = new URLSearchParams(searchParams.toString())
    if (next.range) params.set('range', next.range)
    if (next.team) params.set('team', next.team)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div
      aria-busy={pending}
      className={`flex flex-wrap items-center gap-2 transition-opacity ${
        pending ? 'opacity-60' : ''
      }`}
    >
      <div className="inline-flex rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1">
        {ranges.map((item) => {
          const active = item.key === range
          return (
            <button
              aria-pressed={active}
              className={
                active
                  ? 'inline-flex h-7 items-center gap-1.5 rounded-[6px] bg-white px-3 text-[12px] font-semibold text-[var(--color-text-primary)] shadow-sm'
                  : 'inline-flex h-7 items-center gap-1.5 rounded-[6px] px-3 text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-white/70'
              }
              disabled={pending}
              key={item.key}
              onClick={() => update({ range: item.key })}
              type="button"
            >
              {active && pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {item.label}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {teams.map((item) => {
          const active = item.key === team
          return (
            <button
              aria-pressed={active}
              className={
                active
                  ? 'inline-flex h-7 items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3 text-[12px] font-semibold text-white shadow-sm'
                  : 'inline-flex h-7 items-center rounded-full border border-[var(--color-border)] bg-white px-3 text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
              }
              disabled={pending}
              key={item.key}
              onClick={() => update({ team: item.key })}
              type="button"
            >
              {active && pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
