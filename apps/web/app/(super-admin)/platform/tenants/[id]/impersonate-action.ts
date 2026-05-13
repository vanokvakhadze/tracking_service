'use server'

import { getCurrentUser } from '@/lib/auth/actions'
import { createAdminClient } from '@/lib/supabase/admin'

interface ImpersonateInput {
  userId: string
  tenantId: string
}

interface ImpersonateResult {
  ok: boolean
  link?: string
  error?: string
}

export async function impersonateUser(input: ImpersonateInput): Promise<ImpersonateResult> {
  const me = await getCurrentUser()
  if (!me?.is_super_admin) {
    return { ok: false, error: 'Forbidden' }
  }

  const admin = createAdminClient()

  const { data: targetUser, error: lookupErr } = await admin
    .from('users')
    .select('email')
    .eq('id', input.userId)
    .single()

  if (lookupErr || !targetUser?.email) {
    return { ok: false, error: 'User not found' }
  }

  const { count: membershipCount } = await admin
    .from('tenant_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', input.userId)
    .eq('tenant_id', input.tenantId)

  if (!membershipCount) {
    return { ok: false, error: 'User is not a member of this tenant' }
  }

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: targetUser.email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard`,
    },
  })

  if (linkErr || !linkData?.properties?.action_link) {
    return { ok: false, error: linkErr?.message ?? 'Failed to generate link' }
  }

  await admin.from('audit_logs').insert({
    tenant_id: input.tenantId,
    actor_user_id: me.id,
    action: 'admin.impersonate',
    entity_type: 'user',
    entity_id: input.userId,
    metadata: {
      target_email: targetUser.email,
      tenant_id: input.tenantId,
    },
  })

  return { ok: true, link: linkData.properties.action_link }
}
