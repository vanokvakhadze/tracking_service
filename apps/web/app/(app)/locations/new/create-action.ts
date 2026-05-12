'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const CreateLocationSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(2).max(100),
  category: z.enum(['office', 'client_site', 'warehouse', 'checkpoint', 'other']),
  address: z.string().max(300).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusM: z.coerce.number().int().min(50).max(5000),
})

export async function createLocation(formData: FormData) {
  const parsed = CreateLocationSchema.safeParse({
    tenantId: formData.get('tenantId'),
    name: formData.get('name'),
    category: formData.get('category'),
    address: formData.get('address') || null,
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    radiusM: formData.get('radiusM'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'არასწორი მონაცემები' }
  }

  const supabase = await createClient()
  // @ts-expect-error — create_location lands in generated types after
  // migration 07 is applied + db:types is regenerated.
  const { error } = await supabase.rpc('create_location', {
    p_tenant_id: parsed.data.tenantId,
    p_name: parsed.data.name,
    p_category: parsed.data.category,
    p_address: parsed.data.address ?? null,
    p_latitude: parsed.data.latitude,
    p_longitude: parsed.data.longitude,
    p_radius_m: parsed.data.radiusM,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/locations')
}
