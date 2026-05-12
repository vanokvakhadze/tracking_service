'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { inviteUser } from './invite-action'

export default function UsersPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

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

  return (
    <main className="p-8 max-w-xl">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
        თანამშრომლების მოწვევა
      </h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        ლინკი მუშაობს 7 დღე. ემაილით გაგზავნა მოდევნო ფაზაში.
      </p>

      <form action={handleSubmit} className="mt-6 space-y-4">
        <Input id="email" name="email" type="email" label="ემაილი" required />

        <div className="space-y-1">
          <label
            htmlFor="role"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]"
          >
            როლი
          </label>
          <select
            id="role"
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
          <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-xs text-[var(--color-error-text)]">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} size="lg">
          მოწვევის ლინკის გენერირება
        </Button>

        {inviteUrl && (
          <div className="rounded-md border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-3 text-xs text-[var(--color-success-text)]">
            <p className="font-semibold">მოწვევა მზადაა — გადაუგზავნე ლინკი:</p>
            <code className="mt-1 block break-all rounded bg-white px-2 py-1 text-[var(--color-text-primary)]">
              {inviteUrl}
            </code>
          </div>
        )}
      </form>
    </main>
  )
}
