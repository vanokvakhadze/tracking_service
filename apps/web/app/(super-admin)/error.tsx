'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

export default function SuperAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[SuperAdminError]', error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[10px] border border-[var(--color-border)] bg-white p-8 text-center">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-error-bg)] text-[var(--color-error-text)]"
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
          Platform query failed
        </h2>
        <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
          Cross-tenant query returned an error. Check Supabase logs for the server-role call.
        </p>
        {error.digest && (
          <p className="mt-3 inline-block rounded-[6px] bg-[var(--color-surface)] px-2 py-1 font-mono text-[10px] text-[var(--color-text-tertiary)]">
            ID: {error.digest}
          </p>
        )}
        <div className="mt-6">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-8 items-center gap-2 rounded-[6px] bg-[var(--color-accent)] px-4 text-[13px] font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}
