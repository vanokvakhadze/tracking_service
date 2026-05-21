import { Sparkline } from './Sparkline'

export interface TeamPerformanceRow {
  location: string
  trend: number[]
  current: number
}

interface TeamPerformanceCardProps {
  rows: TeamPerformanceRow[]
  average: number
  attendance: number
}

export function TeamPerformanceCard({ rows, average, attendance }: TeamPerformanceCardProps) {
  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="border-b border-[var(--color-border)] px-5 py-3">
        <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">
          გუნდის პროდუქტიულობა · ბოლო 7 დღე
        </h2>
      </div>
      <div className="p-5">
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Summary label="საშუალო" value={`${average}%`} />
          <Summary label="დასწრება" value={`${attendance}%`} />
        </div>
        {rows.length === 0 ? (
          <div className="grid min-h-[170px] place-items-center text-center text-[13px] text-[var(--color-text-secondary)]">
            მონაცემები 7 დღეში მზადდება
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {rows.map((row) => (
              <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" key={row.location}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-[var(--color-text-primary)]">
                    {row.location}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">ვიზიტები და dwell</p>
                </div>
                <Sparkline points={row.trend} />
                <p className="w-12 text-right text-[13px] font-bold tabular-nums text-[var(--color-text-primary)]">
                  {row.current}%
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-[var(--color-text-tertiary)]">
        {label}
      </p>
      <p className="mt-1 text-[20px] font-bold tabular-nums text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  )
}
