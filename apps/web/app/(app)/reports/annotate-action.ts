'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

const Schema = z.object({
  shiftId: z.string().uuid(),
  notes: z.string().max(500),
})

export async function annotateShift(input: z.infer<typeof Schema>) {
  const parsed = Schema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'invalid' }
  }

  const me = await getCurrentUser()
  const membership = me?.memberships?.find((m) => m.is_active)
  if (!membership || !['tenant_admin', 'super_admin'].includes(membership.role)) {
    return { error: 'forbidden' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('shifts')
    .update({ notes: parsed.data.notes || null, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.shiftId)

  if (error) return { error: error.message }

  revalidatePath('/reports')
  return { ok: true }
}
