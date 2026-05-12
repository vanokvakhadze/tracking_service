'use client'

import { ChevronDown, LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { logout } from '@/lib/auth/actions'

interface UserMenuProps {
  initials: string
  displayName: string
  role: string
}

export function UserMenu({ initials, displayName, role }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-[6px] h-8 px-2 text-[13px] hover:bg-[var(--color-surface-2)]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent-tint)] text-[11px] font-semibold text-[var(--color-accent)]">
          {initials}
        </span>
        <span className="text-[12px] font-medium text-[var(--color-text-primary)]">
          {displayName}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 rounded-lg border border-[var(--color-border)] bg-white shadow-sm">
          <div className="px-3 py-2 border-b border-[var(--color-border)]">
            <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
              {displayName}
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">{role}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            >
              <LogOut className="h-4 w-4" />
              გასვლა
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
