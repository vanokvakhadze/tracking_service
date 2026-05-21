export interface TopLocationRow {
  id: string
  name: string
  count: number
}

export function TopLocations({ rows }: { rows: TopLocationRow[] }) {
  const max = Math.max(...rows.map((row) => row.count), 1)

  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="border-b border-[var(--color-border)] px-5 py-3">
        <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">Top locations</h2>
        <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">ვიზიტების მიხედვით</p>
      </div>
      <div className="p-5">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-[var(--color-text-secondary)]">
            ჯერ ვიზიტი არ ყოფილა
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.slice(0, 7).map((row, index) => (
              <li className="grid grid-cols-[24px_1fr_48px] items-center gap-3" key={row.id}>
                <span className="text-[12px] font-bold text-[var(--color-text-tertiary)]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-[var(--color-text-primary)]">
                    {row.name}
                  </p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)]"
                      style={{ width: `${(row.count / max) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-right text-[12px] font-bold tabular-nums text-[var(--color-text-primary)]">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
