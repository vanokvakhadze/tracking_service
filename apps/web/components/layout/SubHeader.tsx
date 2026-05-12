import type { ReactNode } from 'react'

interface SubHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function SubHeader({ title, subtitle, actions }: SubHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-3">
      <div>
        <h1 className="text-[20px] font-semibold leading-tight text-[var(--color-text-primary)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
