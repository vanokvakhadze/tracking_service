'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { reportServerActionError } from '@/lib/observability/report-error'
import { createClient } from '@/lib/supabase/server'

const CreateLocationSchema = z
  .object({
    tenantId: z.string().uuid(),
    name: z.string().min(2).max(100),
    category: z.enum(['office', 'client_site', 'warehouse', 'checkpoint', 'other']),
    address: z.string().max(300).optional().nullable(),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    triggerRadiusM: z.coerce.number().int().min(50).max(1500),
    boundaryRadiusM: z.coerce.number().int().min(100).max(5000),
  })
  .refine((value) => value.triggerRadiusM <= value.boundaryRadiusM, {
    message: 'Trigger radius must be less than or equal to Boundary radius',
    path: ['triggerRadiusM'],
  })

export async function createLocation(formData: FormData) {
  const parsed = CreateLocationSchema.safeParse({
    tenantId: formData.get('tenantId'),
    name: formData.get('name'),
    category: formData.get('category'),
    address: formData.get('address') || null,
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    triggerRadiusM: formData.get('triggerRadiusM'),
    boundaryRadiusM: formData.get('boundaryRadiusM'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'არასწორი მონაცემები' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('create_location', {
    p_tenant_id: parsed.data.tenantId,
    p_name: parsed.data.name,
    p_category: parsed.data.category,
    p_address: parsed.data.address ?? '',
    p_latitude: parsed.data.latitude,
    p_longitude: parsed.data.longitude,
    p_trigger_radius_m: parsed.data.triggerRadiusM,
    p_boundary_radius_m: parsed.data.boundaryRadiusM,
  })

  if (error) {
    reportServerActionError(error, {
      action: 'create-location',
      tenantId: parsed.data.tenantId,
      extra: { name: parsed.data.name, category: parsed.data.category },
    })
    return { error: error.message }
  }

  redirect('/locations')
}
