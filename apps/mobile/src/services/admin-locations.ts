import { supabase } from './supabase'

export type AdminLocationCategory = 'office' | 'client_site' | 'warehouse' | 'checkpoint' | 'other'

export interface CreateAdminLocationInput {
  tenantId: string
  name: string
  category: AdminLocationCategory
  address: string | null
  latitude: number
  longitude: number
  triggerRadiusM: number
  boundaryRadiusM: number
}

export async function createAdminLocation(input: CreateAdminLocationInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_location', {
    p_tenant_id: input.tenantId,
    p_name: input.name,
    p_category: input.category,
    p_address: input.address ?? '',
    p_latitude: input.latitude,
    p_longitude: input.longitude,
    p_trigger_radius_m: input.triggerRadiusM,
    p_boundary_radius_m: input.boundaryRadiusM,
  })

  if (error) throw new Error(error.message)
  if (typeof data !== 'string') throw new Error('create_location did not return an id')
  return data
}
