import { Skeleton } from '@/components/ui/Skeleton'

export default function BillingLoading() {
  return (
    <>
      <div className="flex h-12 items-center border-b border-[var(--color-border)] bg-white px-6">
        <Skeleton className="h-4 w-28" />
      </div>
      <main className="p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-[10px]" />
          <Skeleton className="h-56 rounded-[10px]" />
        </div>
        <Skeleton className="h-32 rounded-[10px]" />
      </main>
    </>
  )
}
