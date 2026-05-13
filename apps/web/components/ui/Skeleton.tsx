import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={clsx('animate-pulse rounded-[6px] bg-[var(--color-surface-2)]', className)}
    />
  )
}

interface SkeletonTextProps {
  lines?: number
  className?: string
}

export function SkeletonText({ lines = 1, className }: SkeletonTextProps) {
  return (
    <div className={clsx('space-y-1.5', className)}>
      {Array.from({ length: lines }, (_, i) => `line-${i}-of-${lines}`).map((id, i) => (
        <Skeleton
          key={id}
          className={clsx('h-3', i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

interface SkeletonCardProps {
  rows?: number
  showAvatar?: boolean
  className?: string
}

export function SkeletonCard({ rows = 3, showAvatar = false, className }: SkeletonCardProps) {
  return (
    <div
      className={clsx(
        'flex items-start gap-3 rounded-[10px] border border-[var(--color-border)] bg-white p-4',
        className,
      )}
    >
      {showAvatar && <Skeleton className="h-10 w-10 shrink-0 rounded-full" />}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <SkeletonText lines={rows} />
      </div>
    </div>
  )
}
