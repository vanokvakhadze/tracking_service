import { clsx } from 'clsx'

type Tone = 'accent' | 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface AvatarProps {
  initials: string
  /** Seed used to deterministically pick a tone — usually the user id or email */
  seed?: string
  size?: 'sm' | 'md' | 'lg'
  tone?: Tone
  className?: string
}

const tonePalette: Record<Tone, string> = {
  accent: 'bg-[var(--color-accent-tint)] text-[var(--color-accent)]',
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
  warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]',
  error: 'bg-[var(--color-error-bg)] text-[var(--color-error-text)]',
  info: 'bg-[var(--color-info-bg)] text-[var(--color-info-text)]',
  neutral: 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]',
}

const toneOrder: Tone[] = ['accent', 'success', 'warning', 'info', 'error', 'neutral']

const sizes = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-[12px]',
  lg: 'h-9 w-9 text-[13px]',
} as const

function hashSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash
}

export function Avatar({ initials, seed, size = 'md', tone, className }: AvatarProps) {
  const pickedTone = tone ?? toneOrder[hashSeed(seed ?? initials) % toneOrder.length]
  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        sizes[size],
        tonePalette[pickedTone ?? 'accent'],
        className,
      )}
    >
      {initials}
    </span>
  )
}
