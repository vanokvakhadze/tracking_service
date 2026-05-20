'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapStage } from './MapStage'
import { TrackerDetailPanel } from './TrackerDetailPanel'
import { TrackerListPanel } from './TrackerListPanel'
import type { LiveMapLocation, TimelineEvent, TrackerVM } from './types'
import { elapsedLabel, initialsOf, pickAvatarColors } from './types'

interface ShiftUser {
  first_name: string | null
  last_name: string | null
  email: string | null
}

interface ShiftRow {
  id: string
  user_id: string
  started_at: string
  user: ShiftUser | ShiftUser[] | null
}

interface PingRow {
  user_id: string
  recorded_at: string
  battery_percent: number | null
  accuracy_m: number | null
  speed_mps: number | null
}

interface GeofenceEventRow {
  id: string
  shift_id: string | null
  user_id: string
  event_type: 'enter' | 'exit'
  occurred_at: string
  location: {
    id: string
    name: string | null
    latitude: number | null
    longitude: number | null
  } | null
}

interface Props {
  tenantId: string
  initialTrackers: TrackerVM[]
  initialEvents: GeofenceEventRow[]
  initialPings: PingRow[]
  locations: LiveMapLocation[]
}

export function LiveMapView({
  tenantId,
  initialTrackers,
  initialEvents,
  initialPings,
  locations,
}: Props) {
  const [trackers, setTrackers] = useState<TrackerVM[]>(initialTrackers)
  const [events, setEvents] = useState<GeofenceEventRow[]>(initialEvents)
  const [selectedId, setSelectedId] = useState<string | null>(initialTrackers[0]?.id ?? null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    setTrackers(initialTrackers)
    setEvents(initialEvents)
  }, [initialTrackers, initialEvents])

  useEffect(() => {
    if (!selectedId && trackers.length > 0) {
      setSelectedId(trackers[0]!.id)
    }
  }, [selectedId, trackers])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!tenantId) return
    const supabase = createClient()

    async function refetchShifts() {
      const { data: shiftRows } = await supabase
        .from('shifts')
        .select('id, user_id, started_at, user:users(first_name, last_name, email)')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })

      const { data: latestPings } = await supabase
        .from('location_pings')
        .select('user_id, recorded_at, battery_percent, accuracy_m, speed_mps')
        .eq('tenant_id', tenantId)
        .gte('recorded_at', new Date(Date.now() - 1000 * 60 * 60).toISOString())
        .order('recorded_at', { ascending: false })
        .limit(200)

      const pingByUser = new Map<string, NonNullable<typeof latestPings>[number]>()
      for (const ping of latestPings ?? []) {
        if (!pingByUser.has(ping.user_id)) pingByUser.set(ping.user_id, ping)
      }

      const next: TrackerVM[] = ((shiftRows ?? []) as ShiftRow[]).map((row) =>
        composeTracker(row, pingByUser.get(row.user_id) ?? null, null),
      )
      setTrackers(next)
    }

    async function refetchRecentEvents() {
      const since = new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      const { data } = await supabase
        .from('geofence_events')
        .select(
          'id, shift_id, user_id, event_type, occurred_at, location:locations(id, name, latitude, longitude)',
        )
        .eq('tenant_id', tenantId)
        .gte('occurred_at', since)
        .order('occurred_at', { ascending: false })
        .limit(200)

      setEvents((data ?? []) as unknown as GeofenceEventRow[])
    }

    const channel = supabase
      .channel(`live-map-${tenantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts', filter: `tenant_id=eq.${tenantId}` },
        () => {
          void refetchShifts()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'geofence_events',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          void refetchRecentEvents()
          void refetchShifts()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [tenantId])

  const selectedTracker = useMemo(
    () => trackers.find((t) => t.id === selectedId) ?? null,
    [trackers, selectedId],
  )

  const selectedTimeline = useMemo<TimelineEvent[]>(() => {
    if (!selectedTracker) return []
    return events
      .filter((e) => e.user_id === selectedTracker.user_id)
      .slice(0, 40)
      .map((e) => ({
        id: e.id,
        shift_id: e.shift_id,
        user_id: e.user_id,
        kind: e.event_type,
        locationName: e.location?.name ?? null,
        occurredAt: e.occurred_at,
      }))
  }, [events, selectedTracker])

  const trackersWithCurrentTime = useMemo(
    () => trackers.map((t) => ({ ...t, timeLabel: elapsedLabelFromNow(t.startedAt, now) })),
    [trackers, now],
  )

  return (
    <div className="flex h-[calc(100vh-110px)] overflow-hidden">
      <TrackerListPanel
        trackers={trackersWithCurrentTime}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <MapStage trackers={trackersWithCurrentTime} locations={locations} selectedId={selectedId} />
      <TrackerDetailPanel tracker={selectedTracker} timeline={selectedTimeline} />
    </div>
  )
}

function composeTracker(
  row: ShiftRow,
  ping: {
    battery_percent: number | null
    accuracy_m: number | null
    speed_mps: number | null
  } | null,
  fallbackLocation: { latitude: number | null; longitude: number | null } | null,
): TrackerVM {
  const user = Array.isArray(row.user) ? row.user[0] : row.user
  const firstName = user?.first_name ?? null
  const lastName = user?.last_name ?? null
  const email = user?.email ?? null
  const name = [firstName, lastName].filter(Boolean).join(' ') || email || '—'
  const { bg, fg } = pickAvatarColors(row.user_id)
  return {
    id: row.id,
    user_id: row.user_id,
    name,
    initials: initialsOf(firstName, lastName, email),
    team: 'მიმდინარე ცვლა',
    status: 'active',
    startedAt: row.started_at,
    timeLabel: elapsedLabel(row.started_at),
    lat: fallbackLocation?.latitude ?? null,
    lng: fallbackLocation?.longitude ?? null,
    batteryPercent: ping?.battery_percent ?? null,
    accuracyM: ping?.accuracy_m ?? null,
    speedMps: ping?.speed_mps ?? null,
    avatarBg: bg,
    avatarFg: fg,
  }
}

function elapsedLabelFromNow(iso: string, nowMs: number) {
  const minutes = Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 60000))
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} წთ`
  return `${hours}ს ${rest.toString().padStart(2, '0')}წ`
}
