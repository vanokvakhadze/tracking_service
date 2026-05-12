import { supabase } from './supabase'

export interface MobileLocation {
  id: string
  name: string
  category: 'office' | 'client_site' | 'warehouse' | 'checkpoint' | 'other' | null
  address: string | null
  latitude: number
  longitude: number
  radius_m: number
  is_active: boolean | null
}

/** Locations the current user has visibility into (member-level RLS does the filter). */
export async function fetchTenantLocations(): Promise<MobileLocation[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, category, address, latitude, longitude, radius_m, is_active')
    .is('deleted_at', null)
    .overrideTypes<MobileLocation[], { merge: false }>()

  if (error) return []
  return (data ?? []).filter((l) => l.latitude !== null && l.longitude !== null)
}
