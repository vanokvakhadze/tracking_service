import { Skeleton } from '@/components/ui/Skeleton'
import { SKELETON_KEYS_6 } from '@/components/ui/skeleton-keys'

export default function LocationsLoading() {
  return (
    <>
      <div className="flex h-12 items-center border-b border-[var(--color-border)] bg-white px-6">
        <Skeleton className="h-4 w-32" />
      </div>
      <main className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="rounded-[10px] border border-[var(--color-border)] bg-white overflow-hidden">
          {SKELETON_KEYS_6.map((k) => (
            <div
              key={k}
              className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-3 last:border-b-0"
            >
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
