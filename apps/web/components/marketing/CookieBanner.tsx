'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'trackpro.cookies.consent'

type Consent = 'accepted' | 'rejected'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored !== 'accepted' && stored !== 'rejected') {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  const persist = (value: Consent) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // localStorage may be blocked (private mode, storage full) — banner still hides
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <aside
      aria-label="ქუქი-ფაილების შეთანხმება"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-[12px] border border-[var(--color-border)] bg-[var(--color-bg-elevated,var(--color-bg))] p-4 shadow-lg sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex-1 space-y-1">
          <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
            ქუქი-ფაილები (cookies)
          </h2>
          <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
            TrackPro იყენებს მხოლოდ აუცილებელ ქუქი-ფაილებს სესიის შესანახად და ანონიმურ ანალიტიკას
            გვერდის გასაუმჯობესებლად. დეტალები იხილე{' '}
            <Link
              href="/privacy"
              className="text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              კონფიდენციალურობის პოლიტიკაში
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-row-reverse items-center gap-2 sm:flex-col sm:items-stretch">
          <button
            type="button"
            onClick={() => persist('accepted')}
            className="rounded-[6px] bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]"
          >
            ვეთანხმები
          </button>
          <button
            type="button"
            onClick={() => persist('rejected')}
            className="rounded-[6px] border border-[var(--color-border)] bg-transparent px-4 py-2 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            მხოლოდ აუცილებელი
          </button>
        </div>
      </div>
    </aside>
  )
}
