'use client'

import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { TrackerStatus, TrackerVM } from './types'

const STATUS_LABELS: Record<TrackerStatus, string> = {
  active: 'აქტიური',
  idle: 'დაყოვნება',
  off: 'გათიშული',
}

const STATUS_COLORS: Record<TrackerStatus, string> = {
  active: 'var(--color-success)',
  idle: 'var(--color-warning)',
  off: 'var(--color-text-tertiary)',
}

type Filter = 'all' | TrackerStatus

interface Props {
  trackers: TrackerVM[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function TrackerListPanel({ trackers, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const counts = useMemo(
    () => ({
      all: trackers.length,
      active: trackers.filter((t) => t.status === 'active').length,
      idle: trackers.filter((t) => t.status === 'idle').length,
      off: trackers.filter((t) => t.status === 'off').length,
    }),
    [trackers],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return trackers.filter((t) => {
      if (filter !== 'all' && t.status !== filter) return false
      if (!q) return true
      return t.name.toLowerCase().includes(q) || t.team.toLowerCase().includes(q)
    })
  }, [trackers, filter, query])

  return (
    <aside className="flex w-[320px] shrink-0 flex-col overflow-hidden border-r border-[var(--color-border)] bg-white">
      <div className="border-b border-[var(--color-border)] p-3">
        <div className="flex items-center gap-2 rounded-md bg-[var(--color-surface)] px-3 py-2 text-[12px] text-[var(--color-text-tertiary)]">
          <Search className="h-3.5 w-3.5" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ძიება თანამშრომელი ან ჯგუფი…"
            className="flex-1 bg-transparent text-[13px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-[var(--color-border)] px-3 py-2.5">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          ყველა · {counts.all}
        </Chip>
        <Chip active={filter === 'active'} onClick={() => setFilter('active')}>
          აქტიური · {counts.active}
        </Chip>
        <Chip active={filter === 'idle'} onClick={() => setFilter('idle')}>
          დაყოვნება · {counts.idle}
        </Chip>
        <Chip active={filter === 'off'} onClick={() => setFilter('off')}>
          გათიშული · {counts.off}
        </Chip>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="grid h-full place-items-center p-8 text-center">
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              {trackers.length === 0
                ? 'ჯერ აქტიური ცვლა არ არის. მობილური აპლიკაციით ცვლის დაწყების შემდეგ აქ ცოცხლად გამოჩნდება.'
                : 'ფილტრის შესაბამისი ცვლა ვერ მოიძებნა.'}
            </p>
          </div>
        ) : (
          <ul>
            {filtered.map((tracker) => (
              <li key={tracker.id}>
                <button
                  type="button"
                  onClick={() => onSelect(tracker.id)}
                  className={
                    'flex w-full items-center gap-2.5 border-b border-[var(--color-border)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface)] ' +
                    (selectedId === tracker.id
                      ? 'bg-[var(--color-accent-tint)] border-l-[3px] border-l-[var(--color-accent)] pl-[13px]'
                      : '')
                  }
                >
                  <div
                    className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                    style={{ backgroundColor: tracker.avatarBg, color: tracker.avatarFg }}
                  >
                    {tracker.initials}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-[11px] w-[11px] rounded-full border-2 border-white"
                      style={{ backgroundColor: STATUS_COLORS[tracker.status] }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[var(--color-text-primary)]">
                      {tracker.name}
                    </p>
                    <p className="truncate text-[11px] text-[var(--color-text-secondary)]">
                      {tracker.team}
                    </p>
                  </div>
                  <span className="text-[11px] tabular-nums text-[var(--color-text-tertiary)]">
                    {tracker.timeLabel}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[11px] text-[var(--color-text-tertiary)]">
        ნაჩვენებია {filtered.length} / {trackers.length}
        {filter !== 'all' && <span> · {STATUS_LABELS[filter]}</span>}
      </div>
    </aside>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ' +
        (active
          ? 'bg-[var(--color-accent)] text-white'
          : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]')
      }
    >
      {children}
    </button>
  )
}
