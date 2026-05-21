'use client'

import { deactivateBulkMemberships } from '@/app/(app)/users/deactivate-bulk-action'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

interface BulkActionBarProps {
  selectedIds: string[]
  allSelected: boolean
  onSelectAll: () => void
  onClear: () => void
}

export function BulkActionBar({
  selectedIds,
  allSelected,
  onSelectAll,
  onClear,
}: BulkActionBarProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  if (selectedIds.length === 0) return null

  function showSoon() {
    window.alert('მალე გამოვა')
  }

  function deactivate() {
    startTransition(async () => {
      const result = await deactivateBulkMemberships({ membershipIds: selectedIds })
      if (result.error) {
        window.alert(result.error)
        return
      }
      onClear()
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[8px] border border-[var(--color-accent-tint)] bg-[var(--color-accent-tint)] px-4 py-3 text-[13px] text-[var(--color-accent)]">
      <label className="inline-flex items-center gap-2 font-semibold">
        <input
          checked={allSelected}
          className="h-4 w-4 accent-[var(--color-accent)]"
          onChange={onSelectAll}
          type="checkbox"
        />
        {selectedIds.length} მონიშნული
      </label>
      <div className="flex-1" />
      <Button onClick={showSoon} size="sm" variant="secondary">
        Assign to team
      </Button>
      <Button onClick={showSoon} size="sm" variant="secondary">
        Set shift
      </Button>
      <Button loading={pending} onClick={deactivate} size="sm" variant="secondary">
        Deactivate
      </Button>
    </div>
  )
}
