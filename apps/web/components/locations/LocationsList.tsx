'use client'

import { Building2, Briefcase, ChevronRight, MapPin, Warehouse } from 'lucide-react'
import { clsx } from 'clsx'
import { type LocationRow, categoryLabels } from './types'

const categoryIcons: Record<string, typeof Building2> = {
  office: Building2,
  client_site: Briefcase,
  warehouse: Warehouse,
  checkpoint: MapPin,
  other: MapPin,
}

interface LocationsListProps {
  rows: LocationRow[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function LocationsList({ rows, selectedId, onSelect }: LocationsListProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[10px] border border-[var(--color-border)] bg-white p-12 text-center">
        <MapPin className="mx-auto h-8 w-8 text-[var(--color-text-tertiary)]" />
        <p className="mt-3 text-[13px] text-[var(--color-text-secondary)]">
          ჯერ ლოკაცია არ შექმნილა.
        </p>
        <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
          ზემოთ "+ ახალი ლოკაცია"-დან დაამატე პირველი.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-white divide-y divide-[var(--color-border)]">
      {rows.map((row) => {
        const Icon = categoryIcons[row.category ?? 'other'] ?? MapPin
        const isSelected = row.id === selectedId
        return (
          <button
            key={row.id}
            type="button"
            onClick={() => onSelect(row.id)}
            className={clsx(
              'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
              isSelected ? 'bg-[var(--color-accent-tint)]' : 'hover:bg-[var(--color-surface)]',
            )}
          >
            <span
              className={clsx(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                isSelected
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)]'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]',
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">
                {row.name}
              </p>
              <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">
                {row.address ?? categoryLabels[row.category ?? 'other']} · {row.radius_m} მ რადიუსი
              </p>
            </div>
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                row.is_active
                  ? 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)]',
              )}
            >
              <span
                className={clsx(
                  'h-1.5 w-1.5 rounded-full',
                  row.is_active ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-tertiary)]',
                )}
              />
              {row.is_active ? 'აქტიური' : 'გათიშული'}
            </span>
            <ChevronRight className="h-4 w-4 text-[var(--color-text-tertiary)] shrink-0" />
          </button>
        )
      })}
    </div>
  )
}
