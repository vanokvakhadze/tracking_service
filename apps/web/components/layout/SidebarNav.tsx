'use client'

import { clsx } from 'clsx'
import {
  BarChart3,
  Bell,
  LayoutDashboard,
  MapIcon,
  MapPin,
  Settings,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  badge?: { count: number; tone: 'danger' | 'success' }
}

interface NavSection {
  label: string
  items: NavItem[]
}

function getSections(pendingLocationsCount: number): NavSection[] {
  return [
    {
      label: 'მთავარი',
      items: [
        { href: '/dashboard', label: 'დაშბორდი', icon: LayoutDashboard },
        { href: '/live-map', label: 'ცოცხალი რუკა', icon: MapIcon },
        { href: '/locations', label: 'ლოკაციები', icon: MapPin },
        { href: '/users', label: 'მომხმარებლები', icon: Users },
        { href: '/reports', label: 'რეპორტი', icon: BarChart3 },
        {
          href: '/alerts',
          label: 'ალერტი',
          icon: Bell,
          badge:
            pendingLocationsCount > 0
              ? { count: pendingLocationsCount, tone: 'danger' }
              : undefined,
        },
      ],
    },
    {
      label: 'სხვა',
      items: [{ href: '/settings', label: 'პარამეტრები', icon: Settings }],
    },
  ]
}

interface SidebarNavProps {
  pendingLocationsCount: number
}

export function SidebarNav({ pendingLocationsCount }: SidebarNavProps) {
  const pathname = usePathname()
  const sections = getSections(pendingLocationsCount)

  return (
    <nav>
      {sections.map((section) => (
        <div key={section.label}>
          <p className="px-2.5 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">
            {section.label}
          </p>
          <div className="space-y-0.5">
            {section.items.map(({ href, label, icon: Icon, badge }) => {
              const isActive =
                href === '/locations'
                  ? pathname === href ||
                    (pathname.startsWith('/locations/') &&
                      !pathname.startsWith('/locations/pending'))
                  : pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'flex items-center gap-2.5 rounded-[6px] px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]',
                  )}
                >
                  <Icon
                    className={clsx('h-4 w-4', !isActive && 'text-[var(--color-text-tertiary)]')}
                  />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span
                      className={clsx(
                        'rounded-full px-1.5 text-[10px] font-semibold tabular-nums',
                        isActive
                          ? 'bg-white/20 text-white'
                          : badge.tone === 'success'
                            ? 'bg-[var(--color-success)] text-white'
                            : 'bg-[var(--color-error)] text-white',
                      )}
                    >
                      {badge.count}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
