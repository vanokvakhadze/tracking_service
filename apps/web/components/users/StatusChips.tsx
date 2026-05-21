'use client'

import type { StatusFilter } from './UsersPageClient'

interface StatusChipsProps {
  counts: Record<StatusFilter, number>
  value: StatusFilter
  onChange: (value: StatusFilter) => void
}

const chips: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'ყველა' },
  { key: 'active', label: 'აქტიური' },
  { key: 'suspended', label: 'გათიშული' },
  { key: 'pending', label: 'მოლოდინში' },
]

export function StatusChips({ counts, value, onChange }: StatusChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => {
        const active = chip.key === value
        return (
          <button
            className={
              active
                ? 'inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3 text-[12px] font-semibold text-white'
                : 'inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-3 text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
            }
            key={chip.key}
            onClick={() => onChange(chip.key)}
            type="button"
          >
            {chip.label}
            <span
              className={
                active
                  ? 'rounded-full bg-white/20 px-1.5 text-[10px] font-bold text-white'
                  : 'rounded-full bg-[var(--color-surface-2)] px-1.5 text-[10px] font-bold text-[var(--color-text-secondary)]'
              }
            >
              {counts[chip.key]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
