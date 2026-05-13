import Link from 'next/link'
import type { ReactNode } from 'react'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)] text-[14px] font-bold text-[var(--color-accent-fg)]">
            T
          </span>
          <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
            TrackPro
          </span>
        </Link>
        <div className="flex items-center gap-4 text-[13px]">
          <Link
            href="/pricing"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            ფასები
          </Link>
          <Link
            href="/login"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            შესვლა
          </Link>
          <Link
            href="/signup"
            className="rounded-[6px] bg-[var(--color-accent)] px-3 py-1.5 text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]"
          >
            დაიწყე უფასოდ
          </Link>
        </div>
      </header>
      {children}
    </div>
  )
}
