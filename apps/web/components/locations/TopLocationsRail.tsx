import { MapPinned } from 'lucide-react'
import type { TopLocationRow } from './types'

interface TopLocationsRailProps {
  rows: TopLocationRow[]
}

export function TopLocationsRail({ rows }: TopLocationsRailProps) {
  const maxVisits = Math.max(1, ...rows.map((row) => row.visitsToday))

  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <h3 className="text-[13px] font-bold text-[var(--color-text-primary)]">ტოპ ლოკაციები</h3>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            დღევანდელი ვიზიტების მიხედვით
          </p>
        </div>
        <MapPinned className="h-4 w-4 text-[var(--color-accent)]" />
      </div>

      {rows.length === 0 ? (
        <div className="p-5 text-[12px] text-[var(--color-text-tertiary)]">
          დღევანდელი ვიზიტები ჯერ არ ფიქსირდება.
        </div>
      ) : (
        <div className="space-y-3 p-4">
          {rows.map((row, index) => (
            <div key={row.id}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-[var(--color-text-primary)]">
                    {index + 1}. {row.name}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                    {row.avgDwellMinutes} წთ საშუალოდ
                  </p>
                </div>
                <span className="text-[12px] font-bold tabular-nums text-[var(--color-accent)]">
                  {row.visitsToday}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)]"
                  style={{
                    width: `${Math.max(8, Math.round((row.visitsToday / maxVisits) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
