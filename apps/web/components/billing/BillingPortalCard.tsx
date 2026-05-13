'use client'

import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function BillingPortalCard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openPortal() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null
        setError(json?.error ?? `Stripe ${res.status}`)
        return
      }
      const { url } = (await res.json()) as { url: string }
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      setError('Portal-ის გახსნა ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-[10px] border border-[var(--color-border)] bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">
            ანგარიშები + გადახდის მეთოდი
          </h2>
          <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
            Stripe-ის self-service პორტალში: ბარათის ცვლილება, წინა ანგარიშების გადმოწერა,
            სუბსკრიფციის გაუქმება.
          </p>
        </div>
        <Button onClick={openPortal} loading={loading} variant="secondary">
          <ExternalLink className="h-4 w-4" />
          ფორთული
        </Button>
      </div>
      {error && (
        <div className="mt-3 rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-[12px] text-[var(--color-error-text)]">
          {error}
        </div>
      )}
    </div>
  )
}
