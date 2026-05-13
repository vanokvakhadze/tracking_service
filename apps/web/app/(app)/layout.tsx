import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { getCurrentUser, getCurrentUserDiagnostic, logout } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import type { ReactNode } from 'react'

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
    const diag = await getCurrentUserDiagnostic()
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] p-6">
        <div className="max-w-lg rounded-[10px] border border-[var(--color-border)] bg-white p-6">
          <h1 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
            პროფილი ვერ მოიძებნა
          </h1>
          <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
            auth სესია ცოცხალია, მაგრამ public.users-ში პროფილი არ ჩაიტვირთა.
          </p>
          <pre className="mt-3 overflow-auto rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-[11px] leading-snug">
            {JSON.stringify(diag, null, 2)}
          </pre>
          <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]">
            ⤴ ეს info გაუგზავნე Claude-ს რომ ვაფიქსიროთ. შემდეგ შეგიძლია გასცილდე.
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
  let pendingLocationsCount = 0
  if (tenant?.id) {
    const supabase = await createClient()
    const { count } = await supabase
      .from('locations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .eq('status', 'pending_approval')
      .is('deleted_at', null)
    pendingLocationsCount = count ?? 0
  }

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
        pendingLocationsCount={pendingLocationsCount}
      />

      <main id="main-content" className="overflow-auto bg-[var(--color-surface)]">
        {children}
      </main>
    </div>
  )
}
