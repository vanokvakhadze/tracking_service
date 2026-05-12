'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { signupCompany } from '@/lib/auth/signup-action'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signupCompany(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white p-8">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">დაიწყე უფასოდ</h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
          14 დღიანი trial · არ მოითხოვება ბარათი
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <Input id="fullName" name="fullName" label="თქვენი სახელი" required />
        <Input id="email" name="email" type="email" label="ემაილი" required />
        <Input
          id="password"
          name="password"
          type="password"
          label="პაროლი"
          required
          minLength={8}
        />
        <Input id="companyName" name="companyName" label="კომპანიის სახელი" required />
        <Input
          id="subdomain"
          name="subdomain"
          label="Subdomain"
          placeholder="saqari"
          pattern="^[a-z0-9-]{3,30}$"
          required
        />
        <p className="-mt-2 text-[11px] text-[var(--color-text-tertiary)]">
          მაგ: <strong>saqari</strong>.trackpro.ge
        </p>

        {error && (
          <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-xs text-[var(--color-error-text)]">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          რეგისტრაცია
        </Button>

        <div className="text-center text-[13px] text-[var(--color-text-secondary)]">
          უკვე გაქვს ანგარიში?{' '}
          <Link href="/login" className="text-[var(--color-accent)] hover:underline">
            შესვლა
          </Link>
        </div>
      </form>
    </div>
  )
}
