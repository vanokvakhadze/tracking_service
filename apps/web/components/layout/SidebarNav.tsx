'use client'

import { clsx } from 'clsx'
import { BarChart3, ClipboardList, LayoutDashboard, MapPin, Settings, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'დაშბორდი', icon: LayoutDashboard },
  { href: '/users', label: 'მომხმარებლები', icon: Users },
  { href: '/locations', label: 'ლოკაციები', icon: MapPin },
  { href: '/locations/pending', label: 'მოლოდინში', icon: ClipboardList },
  { href: '/reports', label: 'რეპორტები', icon: BarChart3 },
  { href: '/settings', label: 'პარამეტრები', icon: Settings },
] as const

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-0.5">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-2.5 rounded-[6px] px-2.5 py-1.5 text-[13px] font-medium transition-colors',
              isActive
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)]'
                : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
