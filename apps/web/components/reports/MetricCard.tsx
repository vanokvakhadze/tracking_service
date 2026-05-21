import { Sparkline } from '@/components/dashboard/Sparkline'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string
  delta?: string
  deltaPct?: number
  trend?: number[]
  icon: LucideIcon
  tone?: 'accent' | 'success' | 'warning' | 'error'
}

const toneColors: Record<
  NonNullable<MetricCardProps['tone']>,
  { bg: string; fg: string; line: string }
> = {
  accent: {
    bg: 'var(--color-accent-tint)',
    fg: 'var(--color-accent)',
    line: 'var(--color-accent)',
  },
  success: {
    bg: 'var(--color-success-bg)',
    fg: 'var(--color-success-text)',
    line: 'var(--color-success)',
  },
  warning: {
    bg: 'var(--color-warning-bg)',
    fg: 'var(--color-warning-text)',
    line: 'var(--color-warning)',
  },
  error: { bg: 'var(--color-error-bg)', fg: 'var(--color-error-text)', line: 'var(--color-error)' },
}

export function MetricCard({
  label,
  value,
  delta,
  deltaPct,
  trend,
  icon: Icon,
  tone = 'accent',
}: MetricCardProps) {
  const colors = toneColors[tone]
  return (
    <div className="rounded-[8px] border border-[var(--color-border)] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {label}
        </p>
        <span
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ backgroundColor: colors.bg }}
        >
          <Icon className="h-4 w-4" style={{ color: colors.fg }} />
        </span>
      </div>
      <p className="mt-3 text-[24px] font-semibold leading-tight tabular-nums text-[var(--color-text-primary)]">
        {value}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        {typeof deltaPct === 'number' ? (
          <p
            className={
              deltaPct >= 0
                ? 'text-[11px] font-semibold text-[var(--color-success-text)]'
                : 'text-[11px] font-semibold text-[var(--color-error-text)]'
            }
          >
            {deltaPct >= 0 ? '↑' : '↓'}
            {Math.abs(deltaPct)}%
          </p>
        ) : (
          <p className="text-[11px] text-[var(--color-text-tertiary)]">{delta}</p>
        )}
        {trend && <Sparkline color={colors.line} points={trend} />}
      </div>
    </div>
  )
}
