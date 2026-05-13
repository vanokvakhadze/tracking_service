import { syncTenantGeofences } from '@/src/services/geofence-sync'
import { isTrackingAvailable, stopGeofencing } from '@/src/services/location-tracking'
import { registerPushToken } from '@/src/services/push-tokens'
import { supabase } from '@/src/services/supabase'
import * as Location from 'expo-location'
import { useEffect } from 'react'

/**
 * One-shot bootstrap for Phase 3-Lite background tracking. Runs once after
 * the user is signed in + onboarded. No-ops in Expo Go (background tracking
 * needs a dev build).
 *
 * Responsibilities:
 *  - request "Always" location permission (needed for geofencing)
 *  - register the Expo push token in user_devices
 *  - register the OS-level geofences from the tenant's active locations
 *  - re-sync geofences when public.locations changes (Realtime)
 *  - tear everything down on sign-out
 */
export function useTrackingBootstrap(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !isTrackingAvailable()) return

    let alive = true

    void (async () => {
      const fg = await Location.getForegroundPermissionsAsync()
      if (fg.status !== 'granted') {
        const next = await Location.requestForegroundPermissionsAsync()
        if (next.status !== 'granted') return
      }
      const bg = await Location.getBackgroundPermissionsAsync()
      if (bg.status !== 'granted') {
        const next = await Location.requestBackgroundPermissionsAsync()
        if (next.status !== 'granted') return
      }
      if (!alive) return

      await registerPushToken()
      await syncTenantGeofences()
    })()

    const channel = supabase
      .channel('locations-geofence-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, () => {
        void syncTenantGeofences()
      })
      .subscribe()

    return () => {
      alive = false
      void supabase.removeChannel(channel)
    }
  }, [enabled])

  // Stop OS-level monitoring when the user signs out / becomes unauthed.
  useEffect(() => {
    if (enabled) return
    void stopGeofencing()
  }, [enabled])
}
