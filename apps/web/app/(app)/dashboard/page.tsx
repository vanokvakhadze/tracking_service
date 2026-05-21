import { ActiveAlertsCard, type DashboardAlert } from '@/components/dashboard/ActiveAlertsCard'
import { DashboardLiveMap } from '@/components/dashboard/DashboardLiveMap'
import { HeroGreeting } from '@/components/dashboard/HeroGreeting'
import type { LiveShift } from '@/components/dashboard/LiveShiftsCard'
import { MetricCardV2 } from '@/components/dashboard/MetricCardV2'
import { ScheduleCard, type ScheduleVM } from '@/components/dashboard/ScheduleCard'
import { TasksCard } from '@/components/dashboard/TasksCard'
import {
  TeamPerformanceCard,
  type TeamPerformanceRow,
} from '@/components/dashboard/TeamPerformanceCard'
import { type TeamMemberVM, TeamStatusCard } from '@/components/dashboard/TeamStatusCard'
import { SubHeader } from '@/components/layout/SubHeader'
import type { LocationRow } from '@/components/locations/types'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { Activity, Bell, MapPin, Route, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

type AlertKind = 'mock_gps' | 'location_disabled' | 'low_battery' | 'out_of_zone'
type AlertSeverity = 'critical' | 'warning'

interface UserJoin {
  first_name: string | null
  last_name: string | null
  email: string | null
}

interface ShiftRow {
  id: string
  user_id: string
  started_at: string
  ended_at: string | null
  status: string
  total_distance_m: number | null
  total_dwell_minutes: number | null
  locations_visited: number | null
  user: UserJoin | UserJoin[] | null
}

interface MembershipRow {
  id: string
  user_id: string
  is_active: boolean | null
  user: UserJoin | UserJoin[] | null
}

interface EventRow {
  id: string
  location_id: string
  occurred_at: string
  location: { name: string | null } | { name: string | null }[] | null
}

interface AdminAlertRow {
  id: string
  severity: string
  kind: string
  user_name: string
  occurred_at: string
}

const ALERT_KINDS: AlertKind[] = ['mock_gps', 'location_disabled', 'low_battery', 'out_of_zone']

export default async function DashboardPage() {
  const currentUser = await getCurrentUser()
  const membership = currentUser?.memberships?.find((item) => item.is_active)
  const tenant = membership?.tenant

  const supabase = await createClient()
  let locations: LocationRow[] = []
  let activeShifts: ShiftRow[] = []
  let todayShifts: ShiftRow[] = []
  let members: MembershipRow[] = []
  let events: EventRow[] = []
  let alerts: DashboardAlert[] = []

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(todayStart.getDate() - 1)
  const sevenDaysAgo = new Date(todayStart)
  sevenDaysAgo.setDate(todayStart.getDate() - 6)

  let yesterdayShifts: ShiftRow[] = []

  if (tenant?.id) {
    const [
      locationsResult,
      activeResult,
      todayResult,
      yesterdayResult,
      membersResult,
      eventsResult,
      alertsResult,
    ] = await Promise.all([
      supabase
        .from('locations')
        .select('id, name, category, address, latitude, longitude, radius_m, is_active, created_at')
        .eq('tenant_id', tenant.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .overrideTypes<LocationRow[], { merge: false }>(),
      supabase
        .from('shifts')
        .select(
          'id, user_id, started_at, ended_at, status, total_distance_m, total_dwell_minutes, locations_visited, user:users(first_name, last_name, email)',
        )
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false }),
      supabase
        .from('shifts')
        .select(
          'id, user_id, started_at, ended_at, status, total_distance_m, total_dwell_minutes, locations_visited, user:users(first_name, last_name, email)',
        )
        .eq('tenant_id', tenant.id)
        .gte('started_at', todayStart.toISOString())
        .order('started_at', { ascending: true }),
      supabase
        .from('shifts')
        .select('id, user_id, started_at, ended_at, status, total_distance_m')
        .eq('tenant_id', tenant.id)
        .gte('started_at', yesterdayStart.toISOString())
        .lt('started_at', todayStart.toISOString()),
      supabase
        .from('tenant_memberships')
        .select('id, user_id, is_active, user:users(first_name, last_name, email)')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('geofence_events')
        .select('id, location_id, occurred_at, location:locations(name)')
        .eq('tenant_id', tenant.id)
        .gte('occurred_at', sevenDaysAgo.toISOString())
        .order('occurred_at', { ascending: false })
        .limit(500),
      supabase
        .rpc('get_admin_alerts', { p_tenant_id: tenant.id })
        .overrideTypes<AdminAlertRow[], { merge: false }>(),
    ])

    locations = locationsResult.data ?? []
    activeShifts = (activeResult.data ?? []) as ShiftRow[]
    todayShifts = (todayResult.data ?? []) as ShiftRow[]
    yesterdayShifts = (yesterdayResult.data ?? []) as ShiftRow[]
    members = (membersResult.data ?? []) as MembershipRow[]
    events = (eventsResult.data ?? []) as EventRow[]
    alerts = (alertsResult.data ?? []).filter(isValidAlert).map((alert) => ({
      id: alert.id,
      severity: alert.severity,
      kind: alert.kind,
      user_name: alert.user_name,
      occurred_at: alert.occurred_at,
    }))
  }

  const activeLocations = locations.filter((location) => location.is_active).length
  const totalDistanceTodayM = todayShifts.reduce(
    (sum, shift) => sum + (shift.total_distance_m ?? 0),
    0,
  )
  const totalDistanceYesterdayM = yesterdayShifts.reduce(
    (sum, shift) => sum + (shift.total_distance_m ?? 0),
    0,
  )
  const totalDistanceTodayKm = totalDistanceTodayM / 1000
  const shiftsDeltaPct = pctChange(todayShifts.length, yesterdayShifts.length)
  const distanceDeltaPct = pctChange(totalDistanceTodayM, totalDistanceYesterdayM)
  const visitsToday = todayShifts.reduce((sum, shift) => sum + (shift.locations_visited ?? 0), 0)
  const userName = displayName({
    first_name: currentUser?.first_name ?? null,
    last_name: currentUser?.last_name ?? null,
    email: currentUser?.email ?? null,
  })
  const initialShifts = activeShifts.map(toLiveShift)
  const schedule = todayShifts.map(toSchedule)
  const teamMembers = buildTeamMembers(members, activeShifts)
  const performanceRows = buildPerformanceRows(events)
  const productivity = scoreFromShifts(todayShifts)
  const attendance =
    members.length > 0 ? Math.round((activeShifts.length / Math.max(members.length, 1)) * 100) : 0

  return (
    <>
      <SubHeader title="ცოცხალი დაშბორდი" liveLabel="ცოცხალია" />

      <main className="space-y-4 p-6">
        <HeroGreeting
          activeNow={activeShifts.length}
          distanceTodayKm={totalDistanceTodayKm}
          name={userName}
          totalUsers={members.length}
          visitsToday={visitsToday}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCardV2
            deltaPct={shiftsDeltaPct}
            icon={Activity}
            label="აქტიური ცვლები"
            tone="accent"
            trend={trendFromShifts(todayShifts)}
            value={`${activeShifts.length} / ${members.length}`}
          />
          <MetricCardV2
            deltaPct={distanceDeltaPct}
            icon={Route}
            label="დღევანდელი მანძილი"
            tone="success"
            trend={trendFromShifts(todayShifts, 'distance')}
            value={`${totalDistanceTodayKm.toFixed(1)} კმ`}
          />
          <MetricCardV2
            icon={MapPin}
            label="ლოკაციები"
            tone="accent"
            trend={trendFromEvents(events)}
            value={`${activeLocations}`}
          />
          <MetricCardV2
            icon={Bell}
            label="აქტიური ალერტი"
            tone={alerts.some((alert) => alert.severity === 'critical') ? 'error' : 'warning'}
            trend={trendFromAlerts(alerts)}
            value={String(alerts.length)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
          <section className="overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
              <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">
                ცოცხალი რუკა
              </h2>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {activeLocations} ლოკაცია · {activeShifts.length} ცვლა
              </p>
            </div>
            <DashboardLiveMap locations={locations} />
          </section>
          <TasksCard tasks={[]} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ScheduleCard shifts={schedule} />
          <TeamStatusCard initialMembers={teamMembers} tenantId={tenant?.id ?? ''} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TeamPerformanceCard
            attendance={attendance}
            average={productivity}
            rows={performanceRows}
          />
          <ActiveAlertsCard alerts={alerts} />
        </div>
      </main>
    </>
  )
}

function toLiveShift(row: ShiftRow): LiveShift {
  const user = pickUser(row.user)
  return {
    id: row.id,
    user_id: row.user_id,
    user_name: displayName(user),
    started_at: row.started_at,
    location_name: null,
  }
}

function toSchedule(row: ShiftRow): ScheduleVM {
  const user = pickUser(row.user)
  return {
    id: row.id,
    user_name: displayName(user),
    start: row.started_at,
    end: row.ended_at,
    status: row.status,
  }
}

function buildTeamMembers(members: MembershipRow[], activeShifts: ShiftRow[]): TeamMemberVM[] {
  const activeByUser = new Map(activeShifts.map((shift) => [shift.user_id, shift]))
  return members.slice(0, 8).map((member) => {
    const user = pickUser(member.user)
    const activeShift = activeByUser.get(member.user_id)
    return {
      id: member.id,
      user_id: member.user_id,
      user_name: displayName(user),
      email: user?.email ?? '',
      location_name: null,
      status: activeShift ? 'active' : 'off',
      last_seen_at: activeShift?.started_at ?? null,
    }
  })
}

function buildPerformanceRows(events: EventRow[]): TeamPerformanceRow[] {
  const dayKeys = buildSevenDayKeys()
  const grouped = new Map<string, EventRow[]>()
  for (const event of events) {
    const location = pickLocation(event.location)
    const key = location?.name ?? 'უცნობი ლოკაცია'
    grouped.set(key, [...(grouped.get(key) ?? []), event])
  }

  return Array.from(grouped.entries())
    .slice(0, 5)
    .map(([location, locationEvents]) => ({
      location,
      trend: dayKeys.map(
        (key) =>
          locationEvents.filter((event) => dayKey(new Date(event.occurred_at)) === key).length,
      ),
      current: Math.min(100, locationEvents.length * 10),
    }))
}

function trendFromShifts(shifts: ShiftRow[], mode: 'count' | 'distance' = 'count') {
  const keys = buildSevenDayKeys()
  return keys.map((key) =>
    shifts
      .filter((shift) => dayKey(new Date(shift.started_at)) === key)
      .reduce(
        (sum, shift) =>
          mode === 'distance' ? sum + Math.round((shift.total_distance_m ?? 0) / 1000) : sum + 1,
        0,
      ),
  )
}

function trendFromEvents(events: EventRow[]) {
  const keys = buildSevenDayKeys()
  return keys.map(
    (key) => events.filter((event) => dayKey(new Date(event.occurred_at)) === key).length,
  )
}

function trendFromAlerts(alerts: DashboardAlert[]) {
  const keys = buildSevenDayKeys()
  return keys.map(
    (key) => alerts.filter((alert) => dayKey(new Date(alert.occurred_at)) === key).length,
  )
}

function scoreFromShifts(shifts: ShiftRow[]) {
  if (shifts.length === 0) return 0
  const activeMinutes = shifts.reduce((sum, shift) => {
    if (shift.total_dwell_minutes) return sum + shift.total_dwell_minutes
    const end = shift.ended_at ? new Date(shift.ended_at).getTime() : Date.now()
    return sum + Math.max(0, Math.round((end - new Date(shift.started_at).getTime()) / 60000))
  }, 0)
  return Math.min(100, Math.round((activeMinutes / (shifts.length * 8 * 60)) * 100))
}

function pctChange(current: number, previous: number): number | undefined {
  if (previous <= 0) return undefined
  return Math.round(((current - previous) / previous) * 100)
}

function buildSevenDayKeys() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    return dayKey(date)
  })
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function pickUser(user: UserJoin | UserJoin[] | null | undefined) {
  return Array.isArray(user) ? (user[0] ?? null) : (user ?? null)
}

function pickLocation(location: EventRow['location']) {
  return Array.isArray(location) ? (location[0] ?? null) : location
}

function displayName(user: UserJoin | null | undefined) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || '-'
}

function isValidAlert(row: AdminAlertRow): row is AdminAlertRow & {
  severity: AlertSeverity
  kind: AlertKind
} {
  return (
    (row.severity === 'critical' || row.severity === 'warning') &&
    ALERT_KINDS.includes(row.kind as AlertKind)
  )
}
