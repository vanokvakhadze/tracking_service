'use client'

import { deleteMyAccount } from '@/app/(app)/settings/delete-account-action'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { useState } from 'react'

interface DeleteAccountDialogProps {
  open: boolean
  email: string
  onClose: () => void
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function DeleteAccountDialog({ open, email, onClose }: DeleteAccountDialogProps) {
  const [confirmEmail, setConfirmEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const matches = normalizeEmail(confirmEmail) === normalizeEmail(email)

  function reset() {
    setConfirmEmail('')
    setError(null)
    setLoading(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(formData: FormData) {
    if (!matches) return
    setLoading(true)
    setError(null)
    const result = await deleteMyAccount(formData)
    setLoading(false)
    if (result?.error) setError(result.error)
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="ანგარიშის წაშლა"
      description="ეს მოქმედება შეუქცევადია. მონაცემების სრული წაშლა 30 დღეში დასრულდება."
    >
      <form action={handleSubmit} className="space-y-4">
        <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-[12px] leading-5 text-[var(--color-error-text)]">
          ანგარიშის წაშლის შემდეგ ყველა აქტიური workspace წევრობა გაითიშება და სისტემიდან გამოხვალ.
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            მიმდინარე ელ. ფოსტა
          </p>
          <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13px] text-[var(--color-text-primary)]">
            {email}
          </div>
        </div>

        <Input
          id="confirmEmail"
          name="confirmEmail"
          type="email"
          label="დაადასტურე ელ. ფოსტა"
          value={confirmEmail}
          onChange={(event) => setConfirmEmail(event.target.value)}
          placeholder={email}
          required
        />

        {error ? (
          <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-[12px] text-[var(--color-error-text)]">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            გაუქმება
          </Button>
          <button
            type="submit"
            disabled={!matches || loading}
            className="inline-flex h-8 items-center justify-center rounded-[6px] bg-[var(--color-error)] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[var(--color-error-text)] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? 'იშლება...' : 'ანგარიშის წაშლა'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
