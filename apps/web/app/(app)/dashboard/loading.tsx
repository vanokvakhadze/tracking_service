import { Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <>
      <div className="flex h-12 items-center border-b border-[var(--color-border)] bg-white px-6">
        <Skeleton className="h-4 w-48" />
      </div>
      <main className="p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {['a', 'b', 'c', 'd'].map((k) => (
            <div
              key={k}
              className="rounded-[10px] border border-[var(--color-border)] bg-white p-4"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-7 w-24" />
              <Skeleton className="mt-2 h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
          <Skeleton className="h-[420px] rounded-[10px]" />
          <Skeleton className="h-[420px] rounded-[10px]" />
        </div>
      </main>
    </>
  )
}
