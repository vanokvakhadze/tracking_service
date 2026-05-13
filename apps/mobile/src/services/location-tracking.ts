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
import { type QueuedEvent, enqueueEvent, flushQueue } from './event-queue'
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
    const [locationId, rawZone] = identifier.split(':')
    if (!locationId) return
    const zone: 'trigger' | 'boundary' = rawZone === 'boundary' ? 'boundary' : 'trigger'

    await postEvent({
      location_id: locationId,
      event_type: eventType,
      zone,
      latitude: data.region.latitude,
      longitude: data.region.longitude,
      accuracy_m: 'radius' in data.region ? (data.region.radius ?? null) : null,
      occurred_at: new Date().toISOString(),
    })
  })
}

type PostEventInput = QueuedEvent

async function sendEvent(event: QueuedEvent): Promise<boolean> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL
  if (!url) return false

  // supabase-js hydrates the session from SecureStore on first call, which
  // works even from inside a TaskManager wake-up because SecureStore is a
  // native module accessible from any JS context.
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) return false

  try {
    const res = await fetch(`${url}/functions/v1/geofence-event`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })
    // 5xx → retry later; 4xx → drop (likely bad payload from old client)
    if (res.status >= 500) return false
    return true
  } catch {
    return false
  }
}

async function postEvent(input: PostEventInput) {
  // Drain any pending events first so the order on the server reflects
  // the order they fired on the device.
  await flushQueue(sendEvent)

  const ok = await sendEvent(input)
  if (!ok) {
    enqueueEvent(input)
  }
}

/**
 * Public hook for app-level retries — call on app foreground.
 * No-op when the queue is empty or storage is unavailable (Expo Go).
 */
export async function flushPendingEvents(): Promise<void> {
  await flushQueue(sendEvent)
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
