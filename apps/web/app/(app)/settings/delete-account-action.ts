'use server'

import { reportServerActionError } from '@/lib/observability/report-error'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const DeleteAccountSchema = z.object({
  confirmEmail: z.string().email(),
})

const ADMIN_ROLES = ['tenant_admin', 'super_admin'] as const

interface MembershipRow {
  tenant_id: string
  user_id: string
  role: string
}

interface SoftDeleteRpcClient {
  rpc: (fn: 'soft_delete_own_account') => Promise<{ error: { message: string } | null }>
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isAdminRole(role: string) {
  return ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])
}

function findSoleAdminTenantId(rows: MembershipRow[], currentUserId: string, tenantIds: string[]) {
  return tenantIds.find((tenantId) => {
    const tenantAdmins = rows.filter((row) => row.tenant_id === tenantId)
    return tenantAdmins.length === 1 && tenantAdmins[0]?.user_id === currentUserId
  })
}

export async function deleteMyAccount(formData: FormData) {
  const parsed = DeleteAccountSchema.safeParse({
    confirmEmail: formData.get('confirmEmail'),
  })

  if (!parsed.success) {
    return { error: 'შეიყვანე სწორი ელ. ფოსტა' }
  }

  const supabase = await createClient()
  let userId: string | undefined

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) throw authError
    if (!user?.email) return { error: 'სესია ვერ დადასტურდა' }

    userId = user.id
    if (normalizeEmail(parsed.data.confirmEmail) !== normalizeEmail(user.email)) {
      return { error: 'ელ. ფოსტა არ ემთხვევა მიმდინარე ანგარიშს' }
    }

    const { data: memberships, error: membershipsError } = await supabase
      .from('tenant_memberships')
      .select('tenant_id, user_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .overrideTypes<MembershipRow[], { merge: false }>()

    if (membershipsError) throw membershipsError

    const adminTenantIds = (memberships ?? [])
      .filter((membership) => isAdminRole(membership.role))
      .map((membership) => membership.tenant_id)

    if (adminTenantIds.length > 0) {
      const { data: adminRows, error: adminRowsError } = await supabase
        .from('tenant_memberships')
        .select('tenant_id, user_id, role')
        .in('tenant_id', adminTenantIds)
        .eq('is_active', true)
        .in('role', ADMIN_ROLES)
        .overrideTypes<MembershipRow[], { merge: false }>()

      if (adminRowsError) throw adminRowsError

      if (findSoleAdminTenantId(adminRows ?? [], user.id, adminTenantIds)) {
        return {
          error:
            'შენ ხარ ერთადერთი ადმინისტრატორი. ჯერ გადაეცი ადმინისტრატორის როლი სხვას ან მოგვწერე support@trackpro.ge.',
        }
      }
    }

    const rpcClient = supabase as unknown as SoftDeleteRpcClient
    const { error: deleteError } = await rpcClient.rpc('soft_delete_own_account')
    if (deleteError) throw deleteError

    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw signOutError
  } catch (error) {
    reportServerActionError(error, {
      action: 'delete-account',
      userId,
    })

    return { error: 'ანგარიშის წაშლა ვერ მოხერხდა. სცადე თავიდან.' }
  }

  redirect('/login?deleted=1')
}
