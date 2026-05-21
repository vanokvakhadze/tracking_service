'use client'

import { clsx } from 'clsx'
import type { LocationCategory } from './types'
import { categoryLabels } from './types'

export type CategoryFilter = 'all' | LocationCategory

interface CategoryChipsProps {
  value: CategoryFilter
  counts: Record<CategoryFilter, number>
  onChange: (value: CategoryFilter) => void
}

const filters: CategoryFilter[] = [
  'all',
  'office',
  'client_site',
  'warehouse',
  'checkpoint',
  'other',
]

export function CategoryChips({ value, counts, onChange }: CategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {filters.map((filter) => {
        const active = value === filter
        const label = filter === 'all' ? 'ყველა' : categoryLabels[filter]

        return (
          <button
            key={filter}
            type="button"
            onClick={() => onChange(filter)}
            className={clsx(
              'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] transition-colors',
              active
                ? 'bg-[var(--color-accent)] font-semibold text-[var(--color-accent-fg)]'
                : 'border border-[var(--color-border)] bg-white font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]',
            )}
          >
            {label}
            <span
              className={clsx(
                'rounded-full px-1.5 text-[10px] font-bold tabular-nums',
                active
                  ? 'bg-white/20 text-[var(--color-accent-fg)]'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]',
              )}
            >
              {counts[filter] ?? 0}
            </span>
          </button>
        )
      })}
    </div>
  )
}
