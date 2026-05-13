'use client'

import { Button } from '@/components/ui/Button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

export default function AppSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AppError]', error)
  }, [error])

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[10px] border border-[var(--color-border)] bg-white p-8 text-center">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-error-bg)] text-[var(--color-error-text)]"
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
          ვერ ჩაიტვირთა
        </h2>
        <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
          მონაცემები ვერ მივიღეთ. სცადე გვერდის refresh.
        </p>
        {error.digest && (
          <p className="mt-3 inline-block rounded-[6px] bg-[var(--color-surface)] px-2 py-1 font-mono text-[10px] text-[var(--color-text-tertiary)]">
            ID: {error.digest}
          </p>
        )}
        <div className="mt-6">
          <Button onClick={reset}>
            <RefreshCw className="h-3.5 w-3.5" />
            სცადე თავიდან
          </Button>
        </div>
      </div>
    </main>
  )
}
