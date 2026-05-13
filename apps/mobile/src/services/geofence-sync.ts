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

// Phase 3-Lite caps: register at most 20 trigger zones to stay under iOS's
// region-monitoring limit. If a tenant has more locations, only the
// closest 20 (by distance from the device's last known coords) get tracked.
const IOS_REGION_LIMIT = 20

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

  // Trigger zone only — boundary alerts will land via background pings.
  const regions: LocationRegionInput[] = usable.slice(0, IOS_REGION_LIMIT).map((loc) => ({
    identifier: `${loc.id}:trigger`,
    latitude: loc.latitude,
    longitude: loc.longitude,
    // iOS rejects radii under ~100m. Clamp to a safe floor.
    radius: Math.max(100, loc.trigger_radius_m ?? loc.radius_m ?? 100),
    notifyOnEnter: true,
    notifyOnExit: true,
  }))

  if (regions.length === 0) {
    await stopGeofencing()
    return
  }
  await startGeofencing(regions)
}
