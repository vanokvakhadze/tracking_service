'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { rejectLocation } from '@/app/(app)/locations/pending/actions'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'

interface RejectDialogProps {
  open: boolean
  locationId: string
  onClose: () => void
}

export function RejectDialog({ open, locationId, onClose }: RejectDialogProps) {
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleReject(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.set('locationId', locationId)

    const result = await rejectLocation(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setReason('')
    setLoading(false)
    onClose()
    router.refresh()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="ლოკაციის უარყოფა"
      description="მიუთითე მოკლე მიზეზი, რომ ჩანაწერი audit trail-ში დარჩეს."
    >
      <form action={handleReject} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="reject-reason"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]"
          >
            მიზეზი
          </label>
          <textarea
            id="reject-reason"
            name="reason"
            required
            minLength={2}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-24 w-full rounded-[6px] border border-[var(--color-border)] bg-white px-3 py-2 text-[13px] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
          />
        </div>
        {error && (
          <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-[12px] text-[var(--color-error-text)]">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            გაუქმება
          </Button>
          <Button type="submit" loading={loading}>
            უარყოფა
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
