export interface ScheduleVM {
  id: string
  user_name: string
  start: string
  end: string | null
  status: string
}

interface ScheduleCardProps {
  shifts: ScheduleVM[]
}

export function ScheduleCard({ shifts }: ScheduleCardProps) {
  const nowPct = getDayPercent(new Date())

  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="border-b border-[var(--color-border)] px-5 py-3">
        <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">
          დღევანდელი ცვლები
        </h2>
        <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">4 ადამიანის timeline</p>
      </div>
      <div className="p-5">
        {shifts.length === 0 ? (
          <div className="grid min-h-[220px] place-items-center text-center text-[13px] text-[var(--color-text-secondary)]">
            დღევანდელი ცვლები არ არის
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative h-4 rounded-full bg-[var(--color-surface-2)]">
              <span
                className="absolute top-[-5px] h-6 w-0.5 rounded-full bg-[var(--color-error)]"
                style={{ left: `${nowPct}%` }}
              />
            </div>
            {shifts.slice(0, 4).map((shift) => {
              const startPct = getDayPercent(new Date(shift.start))
              const endPct = shift.end ? getDayPercent(new Date(shift.end)) : nowPct
              const width = Math.max(endPct - startPct, 2)
              return (
                <div className="grid grid-cols-[120px_1fr] items-center gap-3" key={shift.id}>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-[var(--color-text-primary)]">
                      {shift.user_name}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)]">{shift.status}</p>
                  </div>
                  <div className="relative h-5 rounded-full bg-[var(--color-surface-2)]">
                    <span
                      className="absolute top-1 h-3 rounded-[4px] bg-[var(--color-accent)]"
                      style={{ left: `${startPct}%`, width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
            <div className="flex justify-between text-[10px] text-[var(--color-text-tertiary)]">
              <span>00:00</span>
              <span>12:00</span>
              <span>24:00</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function getDayPercent(date: Date) {
  const minutes = date.getHours() * 60 + date.getMinutes()
  return Math.min(100, Math.max(0, (minutes / 1440) * 100))
}
