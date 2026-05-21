import { LocationsPageClient } from '@/components/locations/LocationsPageClient'
import type {
  LocationRow,
  LocationStats,
  LocationTeamMember,
  TopLocationRow,
} from '@/components/locations/types'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface GeofenceEventRow {
  location_id: string
  user_id: string
  event_type: 'enter' | 'exit'
  occurred_at: string
  user: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  } | null
}

interface ShiftRow {
  user_id: string
  status: 'active' | 'completed' | 'auto_closed' | 'invalid'
  total_dwell_minutes: number | null
  locations_visited: number | null
  user: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  } | null
}

function dayStartIso() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

function displayName(user: GeofenceEventRow['user'] | ShiftRow['user']) {
  if (!user) return 'უცნობი წევრი'
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return name || user.email
}

function getActiveTeam(events: GeofenceEventRow[], activeUsers: Set<string>) {
  const seen = new Set<string>()
  const byLocation = new Map<string, LocationTeamMember[]>()

  for (const event of events) {
    const key = `${event.location_id}:${event.user_id}`
    if (seen.has(key)) continue
    seen.add(key)

    if (event.event_type !== 'enter' || !activeUsers.has(event.user_id) || !event.user) continue

    const members = byLocation.get(event.location_id) ?? []
    members.push({
      id: event.user.id,
      name: displayName(event.user),
      email: event.user.email,
    })
    byLocation.set(event.location_id, members)
  }

  return byLocation
}

function averageDwellFromShifts(shifts: ShiftRow[]) {
  const totals = shifts
    .map((shift) => {
      const visited = Math.max(1, shift.locations_visited ?? 1)
      return Math.round((shift.total_dwell_minutes ?? 0) / visited)
    })
    .filter((minutes) => minutes > 0)

  if (totals.length === 0) return 0
  return Math.round(totals.reduce((sum, minutes) => sum + minutes, 0) / totals.length)
}

export default async function LocationsPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const myActive = me.memberships?.find((m) => m.is_active)
  const tenantId = myActive?.tenant?.id
  if (!tenantId) {
    return (
      <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
        აქტიური workspace ვერ მოიძებნა.
      </main>
    )
  }

  const supabase = await createClient()
  const todayStart = dayStartIso()

  const [locationsResult, eventsResult, shiftsResult] = await Promise.all([
    supabase
      .from('locations')
      .select(
        'id, name, category, address, latitude, longitude, radius_m, boundary_radius_m, is_active, status, created_at',
      )
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .overrideTypes<LocationRow[], { merge: false }>(),
    supabase
      .from('geofence_events')
      .select(
        'location_id, user_id, event_type, occurred_at, user:users(id, first_name, last_name, email)',
      )
      .eq('tenant_id', tenantId)
      .gte('occurred_at', todayStart)
      .order('occurred_at', { ascending: false })
      .limit(1000)
      .overrideTypes<GeofenceEventRow[], { merge: false }>(),
    supabase
      .from('shifts')
      .select(
        'user_id, status, total_dwell_minutes, locations_visited, user:users(id, first_name, last_name, email)',
      )
      .eq('tenant_id', tenantId)
      .gte('started_at', todayStart)
      .order('started_at', { ascending: false })
      .limit(500)
      .overrideTypes<ShiftRow[], { merge: false }>(),
  ])

  const baseRows = locationsResult.data ?? []
  const events = eventsResult.data ?? []
  const shifts = shiftsResult.data ?? []
  const enterEvents = events.filter((event) => event.event_type === 'enter')
  const activeUsers = new Set(
    shifts.filter((shift) => shift.status === 'active').map((shift) => shift.user_id),
  )
  const activeTeamByLocation = getActiveTeam(events, activeUsers)
  const averageDwell = averageDwellFromShifts(shifts)

  const rows: LocationRow[] = baseRows.map((row) => {
    const visitsToday = enterEvents.filter((event) => event.location_id === row.id).length
    const team = activeTeamByLocation.get(row.id) ?? []
    const boundary = row.boundary_radius_m ?? row.radius_m
    const capacity = Math.max(1, Math.round(boundary / 60))

    return {
      ...row,
      analytics: {
        visitsToday,
        avgDwellMinutes: visitsToday > 0 ? averageDwell : 0,
        occupancyPct:
          boundary > 0 ? Math.min(100, Math.round((team.length / capacity) * 100)) : null,
        team,
      },
    }
  })

  const stats: LocationStats = {
    total: rows.length,
    visitsToday: enterEvents.length,
    avgDwellMinutes: averageDwell,
    pending: rows.filter((row) => row.status === 'pending_approval').length,
  }

  const topLocations: TopLocationRow[] = rows
    .map((row) => ({
      id: row.id,
      name: row.name ?? 'უსახელო ლოკაცია',
      visitsToday: row.analytics?.visitsToday ?? 0,
      avgDwellMinutes: row.analytics?.avgDwellMinutes ?? 0,
    }))
    .filter((row) => row.visitsToday > 0)
    .sort((a, b) => b.visitsToday - a.visitsToday)
    .slice(0, 5)

  return <LocationsPageClient initialRows={rows} stats={stats} topLocations={topLocations} />
}
