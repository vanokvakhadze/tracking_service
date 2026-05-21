import { AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react'

const insights = [
  {
    title: 'დილის პიკი გაიზარდა',
    body: 'ბოლო პერიოდში 10:00-12:00 მონაკვეთში ვიზიტები უფრო მჭიდროა.',
    icon: TrendingUp,
    tone: 'info',
  },
  {
    title: 'დაბალი ბატარეის რისკი',
    body: 'ზოგიერთ მოწყობილობაზე battery alert განმეორდა. გადაამოწმე shift-ის დაწყებამდე.',
    icon: AlertTriangle,
    tone: 'warning',
  },
  {
    title: 'ოპტიმიზაციის იდეა',
    body: 'Top locations სია გამოიყენე მარშრუტების დაგეგმვისას.',
    icon: Lightbulb,
    tone: 'success',
  },
] as const

export function AIInsights() {
  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="border-b border-[var(--color-border)] px-5 py-3">
        <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">AI insights</h2>
        <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">სტრუქტურა მზადაა</p>
      </div>
      <div className="space-y-3 p-5">
        {insights.map((insight) => {
          const Icon = insight.icon
          const toneClass =
            insight.tone === 'warning'
              ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'
              : insight.tone === 'success'
                ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
                : 'bg-[var(--color-info-bg)] text-[var(--color-info-text)]'
          return (
            <article
              className="flex gap-3 rounded-[8px] border border-[var(--color-border)] p-3"
              key={insight.title}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-[6px] ${toneClass}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-[12px] font-semibold text-[var(--color-text-primary)]">
                  {insight.title}
                </h3>
                <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                  {insight.body}
                </p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
