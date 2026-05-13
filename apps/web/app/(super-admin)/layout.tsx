import { Button } from '@/components/ui/Button'
import { getCurrentUser, logout } from '@/lib/auth/actions'
import { Activity, Building2, ScrollText, ShieldAlert, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { ReactNode } from 'react'

const NAV_ITEMS = [
  { href: '/platform', label: 'Overview', icon: Activity, exact: true },
  { href: '/platform/tenants', label: 'Tenants', icon: Building2 },
  { href: '/platform/users', label: 'Users', icon: Users },
  { href: '/platform/audit', label: 'Audit log', icon: ScrollText },
]

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.is_super_admin) notFound()

  const userName =
    [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'Platform admin'

  return (
    <div
      className="platform-shell grid h-screen grid-cols-[220px_1fr] grid-rows-[48px_1fr]"
      style={
        {
          // Override KAYA accent with platform amber so all reusable
          // components (Button, Sidebar links, etc.) inherit a distinct tone.
          '--color-accent': '#D97706',
          '--color-accent-hover': '#92400E',
          '--color-accent-soft': '#F59E0B',
          '--color-accent-tint': '#FEF3C7',
          '--color-accent-fg': '#FFFFFF',
        } as React.CSSProperties
      }
    >
      <header className="col-span-2 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[var(--color-accent)] text-[12px] font-bold text-[var(--color-accent-fg)]">
            <ShieldAlert className="h-3.5 w-3.5" />
          </span>
          <div className="leading-tight">
            <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">
              TrackPro Platform
            </p>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">admin.trackpro.ge</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[var(--color-text-secondary)]">{userName}</span>
          <form action={logout}>
            <Button type="submit" variant="secondary" size="sm">
              გასვლა
            </Button>
          </form>
        </div>
      </header>

      <aside className="flex h-full flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)] py-3 px-2">
        <div className="mb-3 flex items-center gap-2 rounded-[6px] border border-[var(--color-accent-soft)] bg-[var(--color-accent-tint)] px-2.5 py-1.5">
          <ShieldAlert className="h-4 w-4 text-[var(--color-accent)]" />
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-accent-hover)]">
            Platform
          </span>
        </div>
        <p className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">
          Operations
        </p>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-[6px] px-2.5 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
            >
              <Icon className="h-4 w-4 text-[var(--color-text-tertiary)]" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-[8px] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3 text-[11px] leading-snug text-[var(--color-warning-text)]">
          ⚠️ Platform admin scope — სრული tenant წვდომა. იყავი ფრთხილად.
        </div>
      </aside>

      <main className="overflow-auto bg-[var(--color-surface)]">{children}</main>
    </div>
  )
}
