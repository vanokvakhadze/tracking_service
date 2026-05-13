import { Skeleton } from '@/components/ui/Skeleton'
import { SKELETON_KEYS_3 } from '@/components/ui/skeleton-keys'

export default function TenantDetailLoading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-3.5 w-20" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-3.5 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {SKELETON_KEYS_3.map((k) => (
          <Skeleton key={`card-${k}`} className="h-44 rounded-[10px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SKELETON_KEYS_3.map((k) => (
          <Skeleton key={`stat-${k}`} className="h-20 rounded-[10px]" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-[10px]" />
    </div>
  )
}
