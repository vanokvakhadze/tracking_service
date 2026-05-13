import { syncTenantGeofences } from '@/src/services/geofence-sync'
import {
  flushPendingEvents,
  isTrackingAvailable,
  stopGeofencing,
} from '@/src/services/location-tracking'
import { registerPushToken } from '@/src/services/push-tokens'
import { supabase } from '@/src/services/supabase'
import * as Location from 'expo-location'
import { useEffect } from 'react'
import { AppState } from 'react-native'

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
      await flushPendingEvents()
    })()

    const channel = supabase
      .channel('locations-geofence-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, () => {
        void syncTenantGeofences()
      })
      .subscribe()

    // Drain the offline event queue whenever the user brings the app to the
    // foreground (after being backgrounded for a while, network may now be
    // available even though geofence events fired offline).
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void flushPendingEvents()
      }
    })

    return () => {
      alive = false
      void supabase.removeChannel(channel)
      appStateSub.remove()
    }
  }, [enabled])

  // Stop OS-level monitoring when the user signs out / becomes unauthed.
  useEffect(() => {
    if (enabled) return
    void stopGeofencing()
  }, [enabled])
}
