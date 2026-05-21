import { CheckCircle2, Clock3 } from 'lucide-react'

export interface DashboardTask {
  id: string
  title: string
  due: string
  assignee?: string
  overdue?: boolean
}

interface TasksCardProps {
  tasks: DashboardTask[]
}

export function TasksCard({ tasks }: TasksCardProps) {
  const overdueCount = tasks.filter((task) => task.overdue).length

  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-3">
        <div>
          <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">
            დღევანდელი დავალებები · {tasks.length} დარჩა
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
            სამუშაო ნაკადის მოკლე სია
          </p>
        </div>
        {overdueCount > 0 && (
          <span className="rounded-full border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-warning-text)]">
            {overdueCount} ვადაგადაცილებული
          </span>
        )}
      </div>
      <div className="p-5">
        {tasks.length === 0 ? (
          <div className="grid min-h-[220px] place-items-center text-center">
            <div>
              <CheckCircle2 className="mx-auto mb-3 h-7 w-7 text-[var(--color-success)]" />
              <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                დავალებები ჯერ არ არის
              </p>
              <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
                დაიწყე ცვლა მობილური აპლიკაციით
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {tasks.map((task) => (
              <li className="flex gap-3 py-3 first:pt-0 last:pb-0" key={task.id}>
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[var(--color-text-primary)]">
                    {task.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                    {task.due}
                    {task.assignee ? ` · ${task.assignee}` : ''}
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
