'use client'

import { CheckCheck } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

const STORAGE_KEY = 'trackpro:alerts:last_seen'

export function MarkSeenButton() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function markSeen() {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()))
    window.dispatchEvent(new Event('trackpro:alerts-seen'))
    const params = new URLSearchParams(searchParams.toString())
    params.set('seen', '1')
    router.replace(`/alerts?${params.toString()}`)
    router.refresh()
  }

  return (
    <button
      className="inline-flex h-8 items-center justify-center gap-2 rounded-[4px] border border-[var(--color-border)] bg-white px-3 text-[13px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
      onClick={markSeen}
      type="button"
    >
      <CheckCheck className="h-4 w-4" />
      მონიშნე ნანახად
    </button>
  )
}
