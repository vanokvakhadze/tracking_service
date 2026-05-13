'use client'

import { Button } from '@/components/ui/Button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-6">
      <div className="w-full max-w-md rounded-[10px] border border-[var(--color-border)] bg-white p-8 text-center">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-error-bg)] text-[var(--color-error-text)]"
        >
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">
          რაღაც დაარღვია
        </h1>
        <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
          შეცდომა ჩავწერეთ. სცადე გვერდი თავიდან.
        </p>
        {error.digest && (
          <p className="mt-3 inline-block rounded-[6px] bg-[var(--color-surface)] px-2 py-1 font-mono text-[10px] text-[var(--color-text-tertiary)]">
            ID: {error.digest}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset}>
            <RefreshCw className="h-3.5 w-3.5" />
            სცადე თავიდან
          </Button>
        </div>
      </div>
    </div>
  )
}
