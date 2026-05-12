'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const UpdateTenantSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(2).max(100),
  timezone: z.string().min(2).max(64),
  defaultLanguage: z.enum(['ka', 'en']),
  defaultGeofenceRadiusM: z.coerce.number().int().min(50).max(5000),
})

export async function updateTenant(formData: FormData) {
  const parsed = UpdateTenantSchema.safeParse({
    tenantId: formData.get('tenantId'),
    name: formData.get('name'),
    timezone: formData.get('timezone'),
    defaultLanguage: formData.get('defaultLanguage'),
    defaultGeofenceRadiusM: formData.get('defaultGeofenceRadiusM'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'არასწორი მონაცემები' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tenants')
    .update({
      name: parsed.data.name,
      timezone: parsed.data.timezone,
      default_language: parsed.data.defaultLanguage,
      default_geofence_radius_m: parsed.data.defaultGeofenceRadiusM,
    })
    .eq('id', parsed.data.tenantId)

  if (error) return { error: 'შენახვა ვერ მოხერხდა' }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: true }
}
