// MMKV-backed offline queue for geofence events. Used by location-tracking.ts
// when a POST to the Edge Function fails (no network, server down, etc.).
//
// MMKV is a native module — it works in dev build but throws in Expo Go.
// We lazy-require so Expo Go simply gets a no-op queue (which is fine,
// since OS-level geofencing also doesn't fire in Expo Go).

import Constants from 'expo-constants'

const isExpoGo = Constants.executionEnvironment === 'storeClient'

const QUEUE_KEY = 'geofence-event-queue'
const MAX_QUEUE_SIZE = 200 // hard ceiling so a long offline window can't fill storage

export interface QueuedEvent {
  location_id: string
  event_type: 'enter' | 'exit'
  zone?: 'trigger' | 'boundary'
  latitude: number
  longitude: number
  accuracy_m: number | null
  occurred_at: string
  is_mock?: boolean
  battery_percent?: number
  speed_mps?: number
}

interface StorageLike {
  getString: (key: string) => string | undefined
  set: (key: string, value: string) => void
  remove: (key: string) => unknown
}

let storageInstance: StorageLike | null | undefined

function storage(): StorageLike | null {
  if (storageInstance !== undefined) return storageInstance
  if (isExpoGo) {
    storageInstance = null
    return null
  }
  try {
    const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv')
    storageInstance = createMMKV({ id: 'trackpro.geofence' }) as StorageLike
  } catch (err) {
    console.warn('[event-queue] MMKV unavailable, queue disabled', err)
    storageInstance = null
  }
  return storageInstance ?? null
}

function read(): QueuedEvent[] {
  const s = storage()
  if (!s) return []
  const raw = s.getString(QUEUE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as QueuedEvent[]) : []
  } catch {
    return []
  }
}

function write(events: QueuedEvent[]): void {
  const s = storage()
  if (!s) return
  if (events.length === 0) {
    s.remove(QUEUE_KEY)
    return
  }
  const trimmed = events.length > MAX_QUEUE_SIZE ? events.slice(-MAX_QUEUE_SIZE) : events
  s.set(QUEUE_KEY, JSON.stringify(trimmed))
}

export function enqueueEvent(event: QueuedEvent): void {
  const current = read()
  current.push(event)
  write(current)
}

export function queueSize(): number {
  return read().length
}

/**
 * Drain the queue by calling `send` for each item, oldest first.
 * On failure we stop draining and keep the remainder for next attempt
 * (events are time-stamped client-side so order is preserved).
 */
export async function flushQueue(send: (event: QueuedEvent) => Promise<boolean>): Promise<void> {
  let current = read()
  if (current.length === 0) return

  while (current.length > 0) {
    const head = current[0]
    let ok = false
    try {
      ok = await send(head)
    } catch {
      ok = false
    }
    if (!ok) break // stop on first failure; retry later
    current = current.slice(1)
    write(current)
  }
}
