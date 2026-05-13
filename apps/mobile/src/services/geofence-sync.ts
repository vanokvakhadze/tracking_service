import { type LocationRegionInput, startGeofencing, stopGeofencing } from './location-tracking'
import { supabase } from './supabase'

interface GeofenceLocation {
  id: string
  latitude: number
  longitude: number
  trigger_radius_m: number | null
  boundary_radius_m: number | null
  radius_m: number | null
}

// Phase 3-Lite caps: register at most 20 regions to stay under iOS's
// region-monitoring limit. With trigger + boundary per location, that's
// 10 locations. If a tenant has more, only the first 10 (by query order
// — typically alphabetical via the locations index) get tracked.
const IOS_REGION_LIMIT = 20
const REGIONS_PER_LOCATION = 2
const LOCATION_LIMIT = Math.floor(IOS_REGION_LIMIT / REGIONS_PER_LOCATION)

/**
 * Pull the tenant's active locations and register them with the OS-level
 * geofencing engine. Call from the app boot AND any time a location is
 * created/edited/deleted in-app to keep the OS state in sync.
 */
export async function syncTenantGeofences(): Promise<void> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, latitude, longitude, trigger_radius_m, boundary_radius_m, radius_m')
    .eq('status', 'active')
    .is('deleted_at', null)
    .overrideTypes<GeofenceLocation[], { merge: false }>()

  if (error) {
    console.error('[geofence-sync] fetch failed', error.message)
    return
  }

  const usable = (data ?? []).filter(
    (l): l is GeofenceLocation & { latitude: number; longitude: number } =>
      l.latitude !== null && l.longitude !== null,
  )

  // Register both rings per location. Boundary alerts on enter/exit fire
  // distinct push notifications; trigger handles shift state.
  const regions: LocationRegionInput[] = usable.slice(0, LOCATION_LIMIT).flatMap((loc) => {
    const trigger = Math.max(100, loc.trigger_radius_m ?? loc.radius_m ?? 100)
    const boundary = Math.max(
      trigger + 1, // boundary must be strictly larger than trigger
      loc.boundary_radius_m ?? loc.radius_m ?? trigger * 2,
    )
    return [
      {
        identifier: `${loc.id}:trigger`,
        latitude: loc.latitude,
        longitude: loc.longitude,
        radius: trigger,
        notifyOnEnter: true,
        notifyOnExit: true,
      },
      {
        identifier: `${loc.id}:boundary`,
        latitude: loc.latitude,
        longitude: loc.longitude,
        radius: boundary,
        notifyOnEnter: true,
        notifyOnExit: true,
      },
    ]
  })

  if (regions.length === 0) {
    await stopGeofencing()
    return
  }
  await startGeofencing(regions)
}
