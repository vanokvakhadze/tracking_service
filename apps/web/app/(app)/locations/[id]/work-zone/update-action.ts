'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

const UpdateWorkZoneSchema = z
  .object({
    locationId: z.string().uuid(),
    triggerRadiusM: z.coerce.number().int().min(50).max(1500),
    boundaryRadiusM: z.coerce.number().int().min(100).max(5000),
  })
  .refine((value) => value.triggerRadiusM <= value.boundaryRadiusM, {
    message: 'Trigger radius must be less than or equal to Boundary radius',
    path: ['triggerRadiusM'],
  })

export async function updateWorkZone(formData: FormData) {
  const parsed = UpdateWorkZoneSchema.safeParse({
    locationId: formData.get('locationId'),
    triggerRadiusM: formData.get('triggerRadiusM'),
    boundaryRadiusM: formData.get('boundaryRadiusM'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'არასწორი მონაცემები' }
  }

  const supabase = await createClient()
  const { data: location } = await supabase
    .from('locations')
    .select('tenant_id')
    .eq('id', parsed.data.locationId)
    .maybeSingle()

  if (!location) return { error: 'ლოკაცია ვერ მოიძებნა' }

  const me = await getCurrentUser()
  const membership = me?.memberships?.find(
    (m) => m.is_active && m.tenant?.id === location.tenant_id,
  )
  if (!membership || !['tenant_admin', 'super_admin'].includes(membership.role)) {
    return { error: 'ამ ცვლილებისთვის admin უფლებაა საჭირო' }
  }

  const { error } = await supabase
    .from('locations')
    .update({
      trigger_radius_m: parsed.data.triggerRadiusM,
      boundary_radius_m: parsed.data.boundaryRadiusM,
      radius_m: parsed.data.boundaryRadiusM,
    })
    .eq('id', parsed.data.locationId)

  if (error) return { error: error.message }

  revalidatePath('/locations')
  revalidatePath(`/locations/${parsed.data.locationId}/work-zone`)
  return { success: true }
}
