'use server'

import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const BulkDeactivateSchema = z.object({
  membershipIds: z.array(z.string().uuid()).min(1).max(200),
})

export async function deactivateBulkMemberships(input: unknown) {
  const parsed = BulkDeactivateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Invalid membership selection' }
  }

  const me = await getCurrentUser()
  const membership = me?.memberships?.find((item) => item.is_active)

  if (!membership || !['tenant_admin', 'super_admin'].includes(membership.role)) {
    return { error: 'Only admins can deactivate users' }
  }

  const tenantId = membership.tenant?.id
  if (!tenantId) return { error: 'No active tenant' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tenant_memberships')
    .update({ is_active: false })
    .in('id', parsed.data.membershipIds)
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }

  revalidatePath('/users')
  return { success: true }
}
