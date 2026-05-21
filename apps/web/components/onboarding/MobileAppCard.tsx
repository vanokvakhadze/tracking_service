'use client'

import { Copy, ExternalLink, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface MobileAppCardProps {
  variant?: 'wide' | 'compact'
}

export function MobileAppCard({ variant = 'wide' }: MobileAppCardProps) {
  const [copied, setCopied] = useState(false)
  const installUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/install` : '/install'

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(installUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked
    }
  }

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-[var(--color-accent-tint)] text-[var(--color-accent)]">
          <Smartphone className="h-5 w-5" />
        </span>
        <div className="min-w-[200px] flex-1">
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
            მობილური აპლიკაცია · გაუზიარე გუნდს
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
            install გვერდი ბეტა-ინსტრუქციით + TestFlight / APK მისაღებად
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-white px-3 text-[11px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]"
            onClick={copyLink}
            type="button"
          >
            <Copy className="h-3 w-3" />
            {copied ? 'დაკოპირდა ✓' : 'install link'}
          </button>
          <Link
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[var(--color-accent)] px-3 text-[11px] font-semibold text-[var(--color-accent-fg)] hover:opacity-90"
            href="/install"
          >
            <ExternalLink className="h-3 w-3" />
            გადახედე
          </Link>
        </div>
      </div>
    )
  }

  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white p-5">
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-[var(--color-accent-tint)] text-[var(--color-accent)]">
          <Smartphone className="h-6 w-6" />
        </span>
        <div className="min-w-[260px] flex-1">
          <h3 className="text-[14px] font-bold text-[var(--color-text-primary)]">
            მობილური აპლიკაცია გუნდისთვის
          </h3>
          <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
            თანამშრომელს მობილური აპლიკაცია სჭირდება ცვლის გასახსნელად. გაუგზავნე install გვერდი —
            ბეტა build-ის ინსტრუქცია iOS + Android-ისთვის.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-white px-3 text-[12px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
              onClick={copyLink}
              type="button"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'დაკოპირდა ✓' : 'install link დააკოპირე'}
            </button>
            <Link
              className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-[var(--color-accent)] px-3 text-[12px] font-semibold text-[var(--color-accent-fg)] hover:opacity-90"
              href="/install"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              install გვერდი
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
