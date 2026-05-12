'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { loginWithPassword } from '@/lib/auth/actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await loginWithPassword(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-accent)] text-xl font-bold text-[var(--color-accent-fg)]">
          T
        </div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
          TrackPro-ში შესვლა
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
          მართე შენი გუნდი ერთი ადგილიდან
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          label="ემაილი"
          placeholder="you@company.ge"
          required
        />
        <Input
          id="password"
          name="password"
          type="password"
          label="პაროლი"
          required
          minLength={8}
        />

        {error && (
          <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-xs text-[var(--color-error-text)]">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          შესვლა
        </Button>

        <div className="text-center text-[13px] text-[var(--color-text-secondary)]">
          არ გაქვს ანგარიში?{' '}
          <Link href="/signup" className="text-[var(--color-accent)] hover:underline">
            დაარეგისტრირე კომპანია
          </Link>
        </div>
      </form>
    </div>
  )
}
