import { Button } from '@/components/ui/Button'
import { getCurrentUser, logout } from '@/lib/auth/actions'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  const activeMembership = user?.memberships?.find((m) => m.is_active)
  const tenant = activeMembership?.tenant
  const fullName = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : ''

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">დაშბორდი</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        გამარჯობა, {fullName || user?.email}
        {tenant && ` (${tenant.name})`}
      </p>

      {activeMembership && (
        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
          როლი: {activeMembership.role}
          {tenant?.subdomain && ` · ${tenant.subdomain}.trackpro.ge`}
        </p>
      )}

      <form action={logout} className="mt-6">
        <Button type="submit" variant="secondary">
          გასვლა
        </Button>
      </form>
    </main>
  )
}
