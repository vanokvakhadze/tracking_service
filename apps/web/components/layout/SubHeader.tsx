import type { ReactNode } from 'react'

interface SubHeaderProps {
  title: string
  subtitle?: string
  liveLabel?: string
  actions?: ReactNode
}

export function SubHeader({ title, subtitle, liveLabel, actions }: SubHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-3.5 gap-4 flex-wrap">
      <div className="flex items-baseline gap-3 flex-1 min-w-0">
        <div className="min-w-0">
          <h1 className="text-[20px] font-bold leading-tight tracking-tight text-[var(--color-text-primary)] truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)] truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {liveLabel && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-2.5 py-1">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-success)]" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--color-success-text)]">
              {liveLabel}
            </span>
          </span>
        )}
        {actions}
      </div>
    </div>
  )
}
