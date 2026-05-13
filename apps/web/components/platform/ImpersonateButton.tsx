'use client'

import { impersonateUser } from '@/app/(super-admin)/platform/tenants/[id]/impersonate-action'
import { LogIn } from 'lucide-react'
import { useState, useTransition } from 'react'

interface Props {
  userId: string
  tenantId: string
  displayName: string
}

export function ImpersonateButton({ userId, tenantId, displayName }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    if (!confirm(`Generate sign-in link for ${displayName}? This will be logged in the audit log.`))
      return
    setError(null)
    startTransition(async () => {
      const result = await impersonateUser({ userId, tenantId })
      if (result.ok && result.link) {
        window.open(result.link, '_blank', 'noopener,noreferrer')
      } else {
        setError(result.error ?? 'Failed')
      }
    })
  }

  return (
    <div className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[var(--color-border)] bg-white px-2.5 text-[11px] font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
      >
        <LogIn className="h-3 w-3" />
        {pending ? '...' : 'Impersonate'}
      </button>
      {error && <p className="mt-1 text-[10px] text-[var(--color-error-text)]">{error}</p>}
    </div>
  )
}
