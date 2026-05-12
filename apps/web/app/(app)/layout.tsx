import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { getCurrentUser, logout } from '@/lib/auth/actions'

function initialsOf(parts: (string | null | undefined)[], fallback = '?'): string {
  const tokens = parts
    .map((p) => p?.trim()?.[0]?.toUpperCase())
    .filter((c): c is string => Boolean(c))
  if (tokens.length === 0) return fallback
  return tokens.slice(0, 2).join('')
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()

  // The middleware already gates the (app) routes by auth cookie. If we get
  // here with no resolved user it means the cookie is valid but the profile
  // row is missing in public.users (most often: a stale auth.users row from a
  // signup that pre-dates the migrations). Don't redirect — that produces an
  // infinite /dashboard ↔ /login loop with the middleware. Show a sign-out
  // surface so the user can clean state.
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] p-6">
        <div className="max-w-md rounded-[10px] border border-[var(--color-border)] bg-white p-6 text-center">
          <h1 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
            პროფილი ვერ მოიძებნა
          </h1>
          <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
            შენი auth სესია ცოცხალია, მაგრამ public.users-ში პროფილი არ არსებობს. ხშირად ეს ხდება
            ძველი signup-ით (მიგრაციამდე) დარჩენილი ანგარიშისთვის. გასცილდი და სცადე ხელახლა.
          </p>
          <form action={logout} className="mt-4">
            <Button type="submit" variant="primary" size="lg">
              გასვლა
            </Button>
          </form>
        </div>
      </div>
    )
  }

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
