import { SubHeader } from '@/components/layout/SubHeader'
import { AIInsights } from '@/components/reports/AIInsights'
import { DonutChart, type DonutSegment } from '@/components/reports/DonutChart'
import { ExportButton } from '@/components/reports/ExportButton'
import { Heatmap } from '@/components/reports/Heatmap'
import { HeroChart, type HeroSeries } from '@/components/reports/HeroChart'
import { Leaderboard, type LeaderboardRow } from '@/components/reports/Leaderboard'
import { type FeedEvent, LiveFeed } from '@/components/reports/LiveFeed'
import { MetricCard } from '@/components/reports/MetricCard'
import { MiniMap, type MiniMapLocation } from '@/components/reports/MiniMap'
import { RangeFilter, type ReportRange, type ReportTeam } from '@/components/reports/RangeFilter'
import { ShiftsTable } from '@/components/reports/ShiftsTable'
import { type TopLocationRow, TopLocations } from '@/components/reports/TopLocations'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { AlertTriangle, Clock, MapPin, Route } from 'lucide-react'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface ReportsPageProps {
  searchParams?: Promise<{ range?: string; team?: string }>
}

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

interface EventRow {
  id: string
  user_id: string
  event_type: string
  occurred_at: string
  location_id: string
  zone: string | null
  user: UserJoin | UserJoin[] | null
  location: { name: string | null } | { name: string | null }[] | null
}

interface LocationRow {
  id: string
  name: string | null
  latitude: number | null
  longitude: number | null
  is_active: boolean | null
}

type AlertKind = 'mock_gps' | 'location_disabled' | 'low_battery' | 'out_of_zone'
type AlertSeverity = 'critical' | 'warning'

interface AdminAlertRow {
  id: string
  severity: string
  kind: string
  user_name: string
  occurred_at: string
}

const ALERT_KINDS: AlertKind[] = ['mock_gps', 'location_disabled', 'low_battery', 'out_of_zone']

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = (await searchParams) ?? {}
  const range = parseRange(params.range)
  const team = parseTeam(params.team)
  const { from, to, previousFrom } = getWindow(range)

  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const myActive = me.memberships?.find((membership) => membership.is_active)
  if (!myActive || !['tenant_admin', 'super_admin'].includes(myActive.role)) {
    return (
      <>
        <SubHeader title="რეპორტები" />
        <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
          ამ გვერდზე წვდომა მხოლოდ admin-ს აქვს.
        </main>
      </>
    )
  }

  const tenantId = myActive.tenant?.id
  if (!tenantId) redirect('/login')

  const supabase = await createClient()
  const [shiftsResult, previousShiftsResult, eventsResult, alertsResult, locationsResult] =
    await Promise.all([
      supabase
        .from('shifts')
        .select(
          'id, user_id, started_at, ended_at, status, total_distance_m, total_dwell_minutes, locations_visited, user:users(first_name, last_name, email)',
        )
        .eq('tenant_id', tenantId)
        .gte('started_at', from.toISOString())
        .lte('started_at', to.toISOString())
        .order('started_at', { ascending: false })
        .limit(1000),
      supabase
        .from('shifts')
        .select(
          'id, user_id, started_at, ended_at, status, total_distance_m, total_dwell_minutes, locations_visited, user:users(first_name, last_name, email)',
        )
        .eq('tenant_id', tenantId)
        .gte('started_at', previousFrom.toISOString())
        .lt('started_at', from.toISOString())
        .limit(1000),
      supabase
        .from('geofence_events')
        .select(
          'id, user_id, event_type, occurred_at, location_id, zone, user:users(first_name, last_name, email), location:locations(name)',
        )
        .eq('tenant_id', tenantId)
        .gte('occurred_at', from.toISOString())
        .lte('occurred_at', to.toISOString())
        .order('occurred_at', { ascending: false })
        .limit(1500),
      supabase
        .rpc('get_admin_alerts', { p_tenant_id: tenantId, p_since: from.toISOString() })
        .overrideTypes<AdminAlertRow[], { merge: false }>(),
      supabase
        .from('locations')
        .select('id, name, latitude, longitude, is_active')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .overrideTypes<LocationRow[], { merge: false }>(),
    ])

  const shifts = ((shiftsResult.data ?? []) as ShiftRow[]).filter((shift) =>
    matchesTeam(shift, team),
  )
  const previousShifts = ((previousShiftsResult.data ?? []) as ShiftRow[]).filter((shift) =>
    matchesTeam(shift, team),
  )
  const events = ((eventsResult.data ?? []) as EventRow[]).filter((event) =>
    matchesTeam(event, team),
  )
  const alerts = (alertsResult.data ?? []).filter(isValidAlert)
  const locations = locationsResult.data ?? []
  const labels = buildLabels(from, to, range)
  const heroSeries = buildHeroSeries(labels, shifts, events, alerts)
  const heatmap = buildHeatmap(events)
  const leaderboard = buildLeaderboard(shifts, previousShifts)
  const topLocations = buildTopLocations(events)
  const liveFeed = buildFeed(events)
  const donutSegments = buildDonut(shifts)
  const activeShifts = shifts.filter((shift) => shift.status === 'active').length
  const distanceKm = shifts.reduce((sum, shift) => sum + (shift.total_distance_m ?? 0), 0) / 1000
  const visits = events.length
  const subtitle = `${rangeLabel(range)} · ${teamLabel(team)}`

  return (
    <>
      <SubHeader
        actions={
          <>
            <RangeFilter range={range} team={team} />
            <ExportButton fromIso={from.toISOString()} toIso={to.toISOString()} />
          </>
        }
        subtitle={subtitle}
        title="რეპორტები"
      />

      <main className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            deltaPct={deltaPct(shifts.length, previousShifts.length)}
            icon={Clock}
            label="აქტიური ცვლები"
            tone="accent"
            trend={heroSeries[0]?.points}
            value={String(activeShifts)}
          />
          <MetricCard
            deltaPct={deltaPct(
              shifts.reduce((sum, shift) => sum + (shift.total_distance_m ?? 0), 0),
              previousShifts.reduce((sum, shift) => sum + (shift.total_distance_m ?? 0), 0),
            )}
            icon={Route}
            label="ჯამური მანძილი"
            tone="success"
            trend={heroSeries[1]?.points}
            value={`${distanceKm.toFixed(1)} კმ`}
          />
          <MetricCard
            icon={MapPin}
            label="ვიზიტი ლოკაციებზე"
            tone="accent"
            trend={eventsByLabel(labels, events)}
            value={String(visits)}
          />
          <MetricCard
            icon={AlertTriangle}
            label="გაფრთხილებები"
            tone={alerts.some((alert) => alert.severity === 'critical') ? 'error' : 'warning'}
            trend={heroSeries[2]?.points}
            value={String(alerts.length)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.55fr_1fr]">
          <HeroChart labels={labels} series={heroSeries} />
          <LiveFeed initialEvents={liveFeed} tenantId={tenantId} />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.55fr_1fr]">
          <Heatmap matrix={heatmap} />
          <Leaderboard rows={leaderboard} />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <TopLocations rows={topLocations} />
          <AIInsights />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.55fr_1fr]">
          <MiniMap locations={locations as MiniMapLocation[]} />
          <DonutChart segments={donutSegments} />
        </div>

        <ShiftsTable
          canAnnotate
          fromIso={from.toISOString()}
          tenantId={tenantId}
          toIso={to.toISOString()}
        />
      </main>
    </>
  )
}

function parseRange(value: string | undefined): ReportRange {
  return value === 'today' || value === '7d' || value === '90d' ? value : '30d'
}

function parseTeam(value: string | undefined): ReportTeam {
  return value === 'tbilisi' || value === 'batumi' || value === 'kutaisi' ? value : 'all'
}

function getWindow(range: ReportRange) {
  const to = new Date()
  const from = new Date(to)
  if (range === 'today') from.setHours(0, 0, 0, 0)
  else from.setDate(to.getDate() - Number.parseInt(range, 10) + 1)
  const previousFrom = new Date(from)
  previousFrom.setTime(from.getTime() - (to.getTime() - from.getTime()))
  return { from, to, previousFrom }
}

function buildLabels(from: Date, to: Date, range: ReportRange) {
  if (range === 'today') return Array.from({ length: 12 }, (_, index) => `${index * 2}:00`)
  const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000))
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(from)
    date.setDate(from.getDate() + index)
    return date.toISOString().slice(5, 10)
  })
}

function buildHeroSeries(
  labels: string[],
  shifts: ShiftRow[],
  events: EventRow[],
  alerts: AdminAlertRow[],
): HeroSeries[] {
  return [
    { name: 'ცვლები', color: 'var(--color-accent)', points: shiftsByLabel(labels, shifts) },
    {
      name: 'მანძილი',
      color: 'var(--color-success)',
      points: labels.map((label) =>
        Math.round(
          shifts
            .filter((shift) => labelOf(shift.started_at, labels) === label)
            .reduce((sum, shift) => sum + (shift.total_distance_m ?? 0), 0) / 1000,
        ),
      ),
    },
    { name: 'ალერტები', color: 'var(--color-warning)', points: alertsByLabel(labels, alerts) },
  ]
}

function buildHeatmap(events: EventRow[]) {
  const matrix = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0))
  for (const event of events) {
    const date = new Date(event.occurred_at)
    const day = (date.getDay() + 6) % 7
    matrix[day]![date.getHours()] += 1
  }
  return matrix
}

function buildLeaderboard(shifts: ShiftRow[], previousShifts: ShiftRow[]): LeaderboardRow[] {
  const previousScores = scoreByUser(previousShifts)
  return Array.from(scoreByUser(shifts).entries())
    .map(([userId, item]) => ({
      user_id: userId,
      name: item.name,
      email: item.email,
      score: item.score,
      delta: item.score - (previousScores.get(userId)?.score ?? 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
}

function buildTopLocations(events: EventRow[]): TopLocationRow[] {
  const counts = new Map<string, TopLocationRow>()
  for (const event of events) {
    const location = pickLocation(event.location)
    const id = event.location_id
    const current = counts.get(id) ?? { id, name: location?.name ?? 'უცნობი ლოკაცია', count: 0 }
    current.count += 1
    counts.set(id, current)
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)
}

function buildFeed(events: EventRow[]): FeedEvent[] {
  return events.slice(0, 30).map((event) => {
    const user = pickUser(event.user)
    const location = pickLocation(event.location)
    return {
      id: event.id,
      user_id: event.user_id,
      user_name: displayName(user),
      event_type: event.event_type,
      occurred_at: event.occurred_at,
      location_name: location?.name ?? null,
    }
  })
}

function buildDonut(shifts: ShiftRow[]): DonutSegment[] {
  const dwell = shifts.reduce((sum, shift) => sum + (shift.total_dwell_minutes ?? 0), 0)
  const active = shifts.reduce((sum, shift) => sum + shiftMinutes(shift), 0)
  const transit = Math.max(0, active - dwell)
  return [
    { label: 'ლოკაციაზე', value: dwell, color: 'var(--color-accent)' },
    { label: 'გზაში', value: transit, color: 'var(--color-success)' },
    { label: 'შესვენება', value: Math.round(active * 0.08), color: 'var(--color-warning)' },
    { label: 'ზონის გარეთ', value: 0, color: 'var(--color-error)' },
  ]
}

function scoreByUser(shifts: ShiftRow[]) {
  const map = new Map<
    string,
    { name: string; email: string; score: number; minutes: number; count: number }
  >()
  for (const shift of shifts) {
    const user = pickUser(shift.user)
    const existing = map.get(shift.user_id) ?? {
      name: displayName(user),
      email: user?.email ?? '',
      score: 0,
      minutes: 0,
      count: 0,
    }
    existing.minutes += shift.total_dwell_minutes ?? shiftMinutes(shift)
    existing.count += 1
    existing.score = Math.min(100, Math.round((existing.minutes / (existing.count * 8 * 60)) * 100))
    map.set(shift.user_id, existing)
  }
  return map
}

function shiftsByLabel(labels: string[], shifts: ShiftRow[]) {
  return labels.map(
    (label) => shifts.filter((shift) => labelOf(shift.started_at, labels) === label).length,
  )
}

function eventsByLabel(labels: string[], events: EventRow[]) {
  return labels.map(
    (label) => events.filter((event) => labelOf(event.occurred_at, labels) === label).length,
  )
}

function alertsByLabel(labels: string[], alerts: AdminAlertRow[]) {
  return labels.map(
    (label) => alerts.filter((alert) => labelOf(alert.occurred_at, labels) === label).length,
  )
}

function labelOf(iso: string, labels: string[]) {
  const date = new Date(iso)
  if (labels[0]?.includes(':')) return `${Math.floor(date.getHours() / 2) * 2}:00`
  return date.toISOString().slice(5, 10)
}

function shiftMinutes(shift: ShiftRow) {
  const end = shift.ended_at ? new Date(shift.ended_at).getTime() : Date.now()
  return Math.max(0, Math.round((end - new Date(shift.started_at).getTime()) / 60000))
}

function deltaPct(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function matchesTeam(row: ShiftRow | EventRow, team: ReportTeam) {
  if (team === 'all') return true
  const user = pickUser(row.user)
  const haystack = [user?.email, user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(team)
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

function rangeLabel(range: ReportRange) {
  if (range === 'today') return 'დღეს'
  return `ბოლო ${range.replace('d', '')} დღე`
}

function teamLabel(team: ReportTeam) {
  return team === 'all' ? 'ყველა გუნდი' : team
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
