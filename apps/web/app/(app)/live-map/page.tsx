import { redirect } from 'next/navigation'
import { SubHeader } from '@/components/layout/SubHeader'
import { LiveMapView } from '@/components/live-map/LiveMapView'
import type { LiveMapLocation, TrackerVM } from '@/components/live-map/types'
import { elapsedLabel, initialsOf, pickAvatarColors } from '@/components/live-map/types'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

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

interface LocationLite {
  id: string
  name: string | null
  latitude: number | null
  longitude: number | null
  radius_m: number
  is_active: boolean | null
}

interface RawGeofenceEvent {
  id: string
  shift_id: string | null
  user_id: string
  event_type: 'enter' | 'exit'
  occurred_at: string
  location:
    | { id: string; name: string | null; latitude: number | null; longitude: number | null }
    | { id: string; name: string | null; latitude: number | null; longitude: number | null }[]
    | null
}

export default async function LiveMapPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const membership = me.memberships?.find((m) => m.is_active)
  const tenant = membership?.tenant
  const isAdmin = membership && ['tenant_admin', 'super_admin'].includes(membership.role)

  if (!tenant?.id || !isAdmin) {
    return (
      <>
        <SubHeader title="ცოცხალი რუკა" />
        <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
          ცოცხალი რუკის ნახვა მხოლოდ admin-ს შეუძლია.
        </main>
      </>
    )
  }

  const supabase = await createClient()
  const sinceIso = new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()

  const [{ data: locationRows }, { data: shiftRows }, { data: pingRows }, { data: eventRows }] =
    await Promise.all([
      supabase
        .from('locations')
        .select('id, name, latitude, longitude, radius_m, is_active')
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .is('deleted_at', null)
        .overrideTypes<LocationLite[], { merge: false }>(),
      supabase
        .from('shifts')
        .select('id, user_id, started_at, user:users(first_name, last_name, email)')
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .overrideTypes<ShiftRow[], { merge: false }>(),
      supabase
        .from('location_pings')
        .select('user_id, recorded_at, battery_percent, accuracy_m, speed_mps')
        .eq('tenant_id', tenant.id)
        .gte('recorded_at', new Date(Date.now() - 1000 * 60 * 60).toISOString())
        .order('recorded_at', { ascending: false })
        .limit(200)
        .overrideTypes<PingRow[], { merge: false }>(),
      supabase
        .from('geofence_events')
        .select(
          'id, shift_id, user_id, event_type, occurred_at, location:locations(id, name, latitude, longitude)',
        )
        .eq('tenant_id', tenant.id)
        .gte('occurred_at', sinceIso)
        .order('occurred_at', { ascending: false })
        .limit(200)
        .overrideTypes<RawGeofenceEvent[], { merge: false }>(),
    ])

  const locations: LiveMapLocation[] = (locationRows ?? []).map((row) => ({
    id: row.id,
    name: row.name ?? '—',
    latitude: row.latitude,
    longitude: row.longitude,
    radius_m: row.radius_m,
    is_active: row.is_active,
  }))

  const pingByUser = new Map<string, PingRow>()
  for (const ping of pingRows ?? []) {
    if (!pingByUser.has(ping.user_id)) pingByUser.set(ping.user_id, ping)
  }

  const eventsByUser = new Map<
    string,
    Array<{
      event_type: 'enter' | 'exit'
      occurred_at: string
      locationLat: number | null
      locationLng: number | null
    }>
  >()
  for (const event of eventRows ?? []) {
    const loc = Array.isArray(event.location) ? event.location[0] : event.location
    const list = eventsByUser.get(event.user_id) ?? []
    list.push({
      event_type: event.event_type,
      occurred_at: event.occurred_at,
      locationLat: loc?.latitude ?? null,
      locationLng: loc?.longitude ?? null,
    })
    eventsByUser.set(event.user_id, list)
  }

  const initialTrackers: TrackerVM[] = (shiftRows ?? []).map((row) => {
    const user = Array.isArray(row.user) ? row.user[0] : row.user
    const firstName = user?.first_name ?? null
    const lastName = user?.last_name ?? null
    const email = user?.email ?? null
    const name = [firstName, lastName].filter(Boolean).join(' ') || email || '—'
    const { bg, fg } = pickAvatarColors(row.user_id)

    const ping = pingByUser.get(row.user_id) ?? null
    const userEvents = eventsByUser.get(row.user_id) ?? []
    const lastEnter = userEvents.find((e) => e.event_type === 'enter')

    return {
      id: row.id,
      user_id: row.user_id,
      name,
      initials: initialsOf(firstName, lastName, email),
      team: lastEnter ? 'სამუშაო ზონაში' : 'მიმდინარე ცვლა',
      status: lastEnter ? 'active' : 'idle',
      startedAt: row.started_at,
      timeLabel: elapsedLabel(row.started_at),
      lat: lastEnter?.locationLat ?? null,
      lng: lastEnter?.locationLng ?? null,
      batteryPercent: ping?.battery_percent ?? null,
      accuracyM: ping?.accuracy_m ?? null,
      speedMps: ping?.speed_mps ?? null,
      avatarBg: bg,
      avatarFg: fg,
    }
  })

  const initialPings: PingRow[] = pingRows ?? []
  const initialEvents = (eventRows ?? []).map((event) => ({
    id: event.id,
    shift_id: event.shift_id,
    user_id: event.user_id,
    event_type: event.event_type,
    occurred_at: event.occurred_at,
    location: Array.isArray(event.location) ? (event.location[0] ?? null) : event.location,
  }))

  return (
    <>
      <SubHeader
        title="ცოცხალი რუკა"
        subtitle={`${locations.filter((l) => l.is_active).length} ლოკაცია · ${initialTrackers.length} აქტიური ცვლა`}
        liveLabel="ცოცხალია"
      />
      <LiveMapView
        tenantId={tenant.id}
        initialTrackers={initialTrackers}
        initialEvents={initialEvents}
        initialPings={initialPings}
        locations={locations}
      />
    </>
  )
}
