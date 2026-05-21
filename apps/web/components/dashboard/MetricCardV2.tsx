import type { LucideIcon } from 'lucide-react'
import { Sparkline } from './Sparkline'

type Tone = 'accent' | 'success' | 'warning' | 'error'

interface MetricCardV2Props {
  label: string
  value: string
  deltaPct?: number
  trend?: number[]
  tone?: Tone
  icon: LucideIcon
}

const toneClasses: Record<Tone, { icon: string; color: string }> = {
  accent: {
    icon: 'bg-[var(--color-accent-tint)] text-[var(--color-accent)]',
    color: 'var(--color-accent)',
  },
  success: {
    icon: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    color: 'var(--color-success)',
  },
  warning: {
    icon: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    color: 'var(--color-warning)',
  },
  error: {
    icon: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
    color: 'var(--color-error)',
  },
}

export function MetricCardV2({
  label,
  value,
  deltaPct,
  trend = [],
  tone = 'accent',
  icon: Icon,
}: MetricCardV2Props) {
  const palette = toneClasses[tone]
  return (
    <article className="overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--color-text-tertiary)]">
          {label}
        </p>
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-[6px] ${palette.icon}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-[26px] font-bold leading-tight tabular-nums text-[var(--color-text-primary)]">
        {value}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <Delta deltaPct={deltaPct} />
        <Sparkline color={palette.color} points={trend} />
      </div>
    </article>
  )
}

function Delta({ deltaPct }: { deltaPct?: number }) {
  if (typeof deltaPct !== 'number') {
    return <p className="text-[11px] font-semibold text-[var(--color-text-tertiary)]">—</p>
  }
  const up = deltaPct >= 0
  return (
    <p
      className={
        up
          ? 'text-[11px] font-semibold text-[var(--color-success-text)]'
          : 'text-[11px] font-semibold text-[var(--color-error-text)]'
      }
    >
      {up ? '↑' : '↓'}
      {Math.abs(deltaPct)}%
    </p>
  )
}
