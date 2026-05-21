import { Avatar } from '@/components/ui/Avatar'

export interface LeaderboardRow {
  user_id: string
  name: string
  email: string
  score: number
  delta: number
}

interface LeaderboardProps {
  rows: LeaderboardRow[]
}

export function Leaderboard({ rows }: LeaderboardProps) {
  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="border-b border-[var(--color-border)] px-5 py-3">
        <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">Leaderboard</h2>
        <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">Top 7 პროდუქტიულობა</p>
      </div>
      <div className="p-5">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-[var(--color-text-secondary)]">
            მონაცემები მზადდება
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.slice(0, 7).map((row, index) => (
              <li className="flex items-center gap-3" key={row.user_id}>
                <span className="w-5 text-[12px] font-bold text-[var(--color-text-tertiary)]">
                  {index + 1}
                </span>
                <Avatar initials={initials(row.name, row.email)} seed={row.user_id} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[12px] font-semibold text-[var(--color-text-primary)]">
                      {row.name}
                    </p>
                    <span className="text-[12px] font-bold tabular-nums text-[var(--color-text-primary)]">
                      {row.score}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)]"
                      style={{ width: `${Math.min(100, Math.max(0, row.score))}%` }}
                    />
                  </div>
                  <p
                    className={
                      row.delta >= 0
                        ? 'mt-1 text-[10px] font-semibold text-[var(--color-success-text)]'
                        : 'mt-1 text-[10px] font-semibold text-[var(--color-error-text)]'
                    }
                  >
                    {row.delta >= 0 ? '+' : ''}
                    {row.delta}% vs prior
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function initials(name: string, email: string) {
  const value = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
  return value.toUpperCase() || email[0]?.toUpperCase() || '?'
}
