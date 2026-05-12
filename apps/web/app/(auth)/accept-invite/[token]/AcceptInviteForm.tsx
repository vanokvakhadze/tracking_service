'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { acceptInviteAction } from './accept-action'

interface AcceptInviteFormProps {
  token: string
  email: string
}

export function AcceptInviteForm({ token, email }: AcceptInviteFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.set('token', token)
    const result = await acceptInviteAction(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-4">
      <Input id="email" label="ემაილი" value={email} readOnly disabled />
      <Input id="firstName" name="firstName" label="სახელი" required />
      <Input id="lastName" name="lastName" label="გვარი" required />
      <Input id="password" name="password" type="password" label="პაროლი" required minLength={8} />

      {error && (
        <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-xs text-[var(--color-error-text)]">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        ანგარიშის შექმნა
      </Button>
    </form>
  )
}
