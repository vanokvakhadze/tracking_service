interface HeatmapProps {
  matrix: number[][]
}

const days = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვ']
const hours = Array.from({ length: 24 }, (_, hour) => ({
  key: `hour-${hour}`,
  value: hour,
}))

export function Heatmap({ matrix }: HeatmapProps) {
  const max = Math.max(...matrix.flat(), 1)

  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="border-b border-[var(--color-border)] px-5 py-3">
        <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">
          აქტივობის heatmap
        </h2>
        <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">24 საათი · 7 დღე</p>
      </div>
      <div className="overflow-x-auto p-5">
        <div className="grid min-w-[720px] grid-cols-[36px_repeat(24,1fr)] gap-1">
          <div />
          {hours.map((hour) => (
            <div
              className="text-center text-[9px] text-[var(--color-text-tertiary)]"
              key={hour.key}
            >
              {hour.value % 3 === 0 ? hour.value : ''}
            </div>
          ))}
          {matrix.map((row, rowIndex) => (
            <Row
              day={days[rowIndex] ?? String(rowIndex + 1)}
              key={days[rowIndex] ?? `day-${rowIndex}`}
              max={max}
              values={row}
            />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-[var(--color-text-tertiary)]">
          <span>ნაკლები</span>
          <div
            className="h-2 w-32 rounded-full border border-[var(--color-border)]"
            style={{
              background:
                'linear-gradient(to right, color-mix(in srgb, var(--color-accent) 8%, transparent), var(--color-accent))',
            }}
          />
          <span className="tabular-nums">მეტი · {max}</span>
        </div>
      </div>
    </section>
  )
}

function Row({ day, max, values }: { day: string; max: number; values: number[] }) {
  return (
    <>
      <div className="flex h-5 items-center text-[10px] font-semibold text-[var(--color-text-tertiary)]">
        {day}
      </div>
      {hours.map((hour) => {
        const value = values[hour.value] ?? 0
        const opacity = Math.max(0.08, value / max)
        return (
          <div
            className="h-5 rounded-[4px] bg-[var(--color-accent)]"
            key={`${day}-${hour.key}`}
            style={{ opacity }}
            title={`${day} ${hour.value}:00 · ${value}`}
          />
        )
      })}
    </>
  )
}
