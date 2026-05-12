'use client'

import { useState } from 'react'
import { inviteUser } from '@/app/(app)/users/invite-action'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'

interface InviteUserDialogProps {
  open: boolean
  onClose: () => void
}

export function InviteUserDialog({ open, onClose }: InviteUserDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function reset() {
    setError(null)
    setInviteUrl(null)
    setCopied(false)
    setLoading(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setInviteUrl(null)
    const result = await inviteUser(formData)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.success && result.inviteUrl) {
      setInviteUrl(result.inviteUrl)
    }
  }

  async function copy() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="თანამშრომლის მოწვევა"
      description="ლინკი მუშაობს 7 დღე. ემაილის გაგზავნა მოგვიანებით."
    >
      {inviteUrl ? (
        <div className="space-y-4">
          <div className="rounded-md border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-3 text-[12px] text-[var(--color-success-text)]">
            მოწვევა შეიქმნა — გადაუგზავნე ლინკი:
          </div>
          <code className="block break-all rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[12px] text-[var(--color-text-primary)]">
            {inviteUrl}
          </code>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={copy}>
              {copied ? 'დაკოპირდა ✓' : 'კოპირება'}
            </Button>
            <Button onClick={handleClose}>დახურვა</Button>
          </div>
        </div>
      ) : (
        <form action={handleSubmit} className="space-y-4">
          <Input id="invite-email" name="email" type="email" label="ემაილი" required />

          <div className="space-y-1">
            <label
              htmlFor="invite-role"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]"
            >
              როლი
            </label>
            <select
              id="invite-role"
              name="role"
              defaultValue="user"
              required
              className="h-8 w-full rounded-[6px] border border-[var(--color-border)] bg-white px-3 text-[13px] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
            >
              <option value="user">თანამშრომელი</option>
              <option value="manager">მენეჯერი</option>
              <option value="tenant_admin">ადმინისტრატორი</option>
            </select>
          </div>

          {error && (
            <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-[12px] text-[var(--color-error-text)]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              გაუქმება
            </Button>
            <Button type="submit" loading={loading}>
              მოწვევის ლინკის გენერირება
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  )
}
