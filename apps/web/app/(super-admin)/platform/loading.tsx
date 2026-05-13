import { Skeleton } from '@/components/ui/Skeleton'
import { SKELETON_KEYS_4, SKELETON_KEYS_5 } from '@/components/ui/skeleton-keys'

export default function PlatformLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-3.5 w-80" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SKELETON_KEYS_4.map((k) => (
          <div key={k} className="rounded-[10px] border border-[var(--color-border)] bg-white p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-28" />
          </div>
        ))}
      </div>
      <div className="rounded-[10px] border border-[var(--color-border)] bg-white overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-4 py-3">
          <Skeleton className="h-7 w-72" />
        </div>
        {SKELETON_KEYS_5.map((k) => (
          <div
            key={k}
            className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0"
          >
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-3.5 w-10" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
