import { supabase } from './supabase'

export interface WorkZoneLocation {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  trigger_radius_m: number
  boundary_radius_m: number
}

interface WorkZoneRow {
  id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  trigger_radius_m: number | null
  boundary_radius_m: number | null
}

export async function fetchWorkZone(locationId: string): Promise<WorkZoneLocation | null> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, address, latitude, longitude, trigger_radius_m, boundary_radius_m')
    .eq('id', locationId)
    .is('deleted_at', null)
    .single()
    .overrideTypes<WorkZoneRow, { merge: false }>()

  if (error || !data) return null
  if (data.latitude === null || data.longitude === null) return null
  return {
    id: data.id,
    name: data.name,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    trigger_radius_m: data.trigger_radius_m ?? 100,
    boundary_radius_m: data.boundary_radius_m ?? 200,
  }
}

export interface UpdateWorkZoneInput {
  locationId: string
  triggerRadiusM: number
  boundaryRadiusM: number
}

export async function updateWorkZone(input: UpdateWorkZoneInput): Promise<void> {
  const { error } = await supabase
    .from('locations')
    .update({
      trigger_radius_m: input.triggerRadiusM,
      boundary_radius_m: input.boundaryRadiusM,
      radius_m: input.boundaryRadiusM,
    })
    .eq('id', input.locationId)

  if (error) throw new Error(error.message)
}
