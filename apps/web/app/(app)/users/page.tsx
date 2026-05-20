import { UsersPageClient } from '@/components/users/UsersPageClient'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const myActive = me.memberships?.find((m) => m.is_active)
  if (!myActive || !['tenant_admin', 'super_admin'].includes(myActive.role)) {
    return (
      <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
        ამ გვერდზე წვდომა მხოლოდ admin-ს აქვს.
      </main>
    )
  }

  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('tenant_memberships')
    .select(
      `
      id,
      role,
      is_active,
      employee_code,
      created_at,
      user:users(id, email, first_name, last_name, avatar_url, last_login_at)
    `,
    )
    .eq('tenant_id', myActive.tenant?.id ?? '')
    .order('created_at', { ascending: false })

  return <UsersPageClient initialRows={rows ?? []} canBulkInvite />
}
