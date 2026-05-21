export interface DonutSegment {
  label: string
  value: number
  color: string
}

export function DonutChart({ segments }: { segments: DonutSegment[] }) {
  const total = Math.max(
    segments.reduce((sum, segment) => sum + segment.value, 0),
    1,
  )
  let offset = 0

  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="border-b border-[var(--color-border)] px-5 py-3">
        <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">
          Time distribution
        </h2>
        <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">დღევანდელი დრო</p>
      </div>
      <div className="p-5">
        <div className="grid place-items-center">
          <svg className="h-44 w-44" role="img" viewBox="0 0 160 160">
            <title>Time distribution donut</title>
            <circle
              cx="80"
              cy="80"
              fill="none"
              r="54"
              stroke="var(--color-surface-2)"
              strokeWidth="18"
            />
            {segments.map((segment) => {
              const length = (segment.value / total) * 339.292
              const dash = `${length} ${339.292 - length}`
              const currentOffset = offset
              offset -= length
              return (
                <circle
                  cx="80"
                  cy="80"
                  fill="none"
                  key={segment.label}
                  r="54"
                  stroke={segment.color}
                  strokeDasharray={dash}
                  strokeDashoffset={currentOffset}
                  strokeLinecap="round"
                  strokeWidth="18"
                  transform="rotate(-90 80 80)"
                />
              )
            })}
            <text
              fill="var(--color-text-primary)"
              fontSize="20"
              fontWeight="700"
              textAnchor="middle"
              x="80"
              y="78"
            >
              {total}
            </text>
            <text fill="var(--color-text-tertiary)" fontSize="10" textAnchor="middle" x="80" y="94">
              წუთი
            </text>
          </svg>
        </div>
        <ul className="mt-4 space-y-2">
          {segments.map((segment) => (
            <li className="flex items-center justify-between gap-3 text-[12px]" key={segment.label}>
              <span className="inline-flex items-center gap-2 text-[var(--color-text-secondary)]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: segment.color }} />
                {segment.label}
              </span>
              <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                {segment.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
