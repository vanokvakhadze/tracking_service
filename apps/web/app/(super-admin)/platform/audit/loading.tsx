import { Skeleton } from '@/components/ui/Skeleton'
import { SKELETON_KEYS_8 } from '@/components/ui/skeleton-keys'

export default function AuditLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-3.5 w-60" />
      </div>
      <div className="rounded-[10px] border border-[var(--color-border)] bg-white overflow-hidden">
        {SKELETON_KEYS_8.map((k) => (
          <div
            key={k}
            className="flex items-center gap-4 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0"
          >
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
