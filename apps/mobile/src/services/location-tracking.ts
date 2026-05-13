// Phase 3-Lite background tracking.
//
// We use the free expo-location + expo-task-manager APIs to register
// OS-level geofences. Events fire on the OS and route through a
// TaskManager task; the task POSTs to the `geofence-event` Edge Function
// which has the authority to open/close shifts and send push notifications.
//
// Why this layout?
//   - expo-task-manager tasks must be defined at module top-level (not
//     inside a component) so the OS can wake them. This file is imported
//     once from the root layout, which registers GEOFENCE_TASK exactly once.
//   - The task body itself does the JWT lookup + POST. No app state is
//     accessible from a wake-up event, only persisted secure storage.

import Constants from 'expo-constants'
import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import { supabase } from './supabase'

export const GEOFENCE_TASK = 'trackpro.geofence.event'

const isExpoGo = Constants.executionEnvironment === 'storeClient'

interface GeofencingTaskBody {
  eventType?: Location.GeofencingEventType
  region?: Location.LocationRegion
  error?: { message: string }
}

if (!isExpoGo) {
  // Define ONCE at module load — TaskManager.defineTask is idempotent
  // by name, so subsequent reloads just refresh the handler reference.
  TaskManager.defineTask<GeofencingTaskBody>(GEOFENCE_TASK, async ({ data, error }) => {
    if (error) {
      console.error('[geofence-task] error', error.message)
      return
    }
    if (!data?.region || data.eventType === undefined) return

    const eventType = data.eventType === Location.GeofencingEventType.Enter ? 'enter' : 'exit'

    // identifier shape: <locationId>:<trigger|boundary>
    const identifier = data.region.identifier ?? ''
    const [locationId, zone] = identifier.split(':')
    if (!locationId) return

    // For v1 we only act on the trigger zone (shift start/end).
    // Boundary-zone events feed into alerts but don't change shift state.
    if (zone !== 'trigger') return

    await postEvent({
      location_id: locationId,
      event_type: eventType,
      latitude: data.region.latitude,
      longitude: data.region.longitude,
      accuracy_m: 'radius' in data.region ? (data.region.radius ?? null) : null,
      occurred_at: new Date().toISOString(),
    })
  })
}

interface PostEventInput {
  location_id: string
  event_type: 'enter' | 'exit'
  latitude: number
  longitude: number
  accuracy_m: number | null
  occurred_at: string
  is_mock?: boolean
  battery_percent?: number
  speed_mps?: number
}

async function postEvent(input: PostEventInput) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL
  if (!url) return

  // supabase-js hydrates the session from SecureStore on first call, which
  // works even from inside a TaskManager wake-up because SecureStore is a
  // native module accessible from any JS context.
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) return

  try {
    await fetch(`${url}/functions/v1/geofence-event`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })
  } catch (err) {
    // OS will replay events when the device wakes; swallow transient errors.
    console.error('[geofence-task] post failed', err)
  }
}

/** True when the OS-level region monitoring + background updates are available. */
export function isTrackingAvailable() {
  return !isExpoGo
}

export type LocationRegionInput = {
  identifier: string
  latitude: number
  longitude: number
  radius: number
  notifyOnEnter?: boolean
  notifyOnExit?: boolean
}

export async function startGeofencing(regions: LocationRegionInput[]): Promise<void> {
  if (isExpoGo) return
  // Stop any existing registration so we don't pile up stale regions.
  const running = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false)
  if (running) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK).catch(() => {})
  }
  if (regions.length === 0) return

  await Location.startGeofencingAsync(
    GEOFENCE_TASK,
    regions.map((r) => ({
      identifier: r.identifier,
      latitude: r.latitude,
      longitude: r.longitude,
      radius: r.radius,
      notifyOnEnter: r.notifyOnEnter ?? true,
      notifyOnExit: r.notifyOnExit ?? true,
    })),
  )
}

export async function stopGeofencing(): Promise<void> {
  if (isExpoGo) return
  const running = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false)
  if (running) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK).catch(() => {})
  }
}
