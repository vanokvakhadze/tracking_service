import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { getCurrentUser } from '@/lib/auth/actions'

function initialsOf(parts: (string | null | undefined)[], fallback = '?'): string {
  const tokens = parts
    .map((p) => p?.trim()?.[0]?.toUpperCase())
    .filter((c): c is string => Boolean(c))
  if (tokens.length === 0) return fallback
  return tokens.slice(0, 2).join('')
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const activeMembership = user.memberships?.find((m) => m.is_active)
  const tenant = activeMembership?.tenant

  const userDisplayName =
    [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'User'
  const userInitials = initialsOf([user.first_name, user.last_name], user.email?.[0] ?? '?')
  const workspaceInitial = (tenant?.name?.[0] ?? 'T').toUpperCase()

  return (
    <div className="grid h-screen grid-cols-[220px_1fr] grid-rows-[48px_1fr] bg-[var(--color-bg)]">
      <div className="col-span-2">
        <TopBar
          workspaceInitial={workspaceInitial}
          workspaceName={tenant?.name ?? 'Workspace'}
          workspaceSubdomain={tenant?.subdomain ?? null}
          userInitials={userInitials}
          userDisplayName={userDisplayName}
          userRole={activeMembership?.role ?? '—'}
        />
      </div>

      <Sidebar
        footerName={userDisplayName}
        footerRole={activeMembership?.role ?? '—'}
        footerInitials={userInitials}
      />

      <main className="overflow-auto bg-[var(--color-surface)]">{children}</main>
    </div>
  )
}
