import { getCurrentUser } from './auth'
import { supabase } from './supabase'
import type { TeamStatus } from './team-positions'

export interface TeamRosterMember {
  user_id: string
  name: string
  initials: string
  email: string
  status: TeamStatus
  current_location_name: string | null
  duration_label: string | null
}

interface TenantContext {
  tenantId: string
  userId: string
}

interface MemberRow {
  user_id: string
  user: { first_name: string | null; last_name: string | null; email: string | null } | null
}

interface ShiftRow {
  id: string
  user_id: string
  started_at: string
}

interface PingRow {
  user_id: string
  recorded_at: string
  is_mock: boolean | null
}

interface EventRow {
  user_id: string
  location: { name: string | null } | { name: string | null }[] | null
}

export async function fetchTeamRoster(): Promise<TeamRosterMember[]> {
  const context = await resolveTenantContext()
  if (!context) return []

  const members = (await fetchActiveMembers(context.tenantId)).filter(
    (member) => member.user_id !== context.userId,
  )
  const memberIds = members.map((member) => member.user_id)
  if (memberIds.length === 0) return []

  const [activeShiftRows, pingRows, eventRows] = await Promise.all([
    fetchActiveShiftRows(context.tenantId),
    fetchLatestPingRows(context.tenantId, memberIds),
    fetchLatestEventRows(context.tenantId, memberIds),
  ])
  const activeShifts = latestByUser(activeShiftRows)
  const latestPings = latestByUser(pingRows)
  const latestEvents = latestByUser(eventRows)

  return members.map((member) => {
    const ping = latestPings.get(member.user_id)
    const shift = activeShifts.get(member.user_id)
    const status = statusForMember(ping, Boolean(shift))
    const name = displayName(member)
    return {
      user_id: member.user_id,
      name,
      initials: initials(name),
      email: member.user?.email ?? '',
      status,
      current_location_name: locationName(latestEvents.get(member.user_id)),
      duration_label: durationLabel(status, shift, ping),
    }
  })
}

async function resolveTenantContext(): Promise<TenantContext | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const memberships = (user.memberships ?? []) as Array<{
    is_active: boolean | null
    tenant: { id: string } | { id: string }[] | null
  }>
  const active = memberships.find((membership) => membership.is_active)
  const tenant = Array.isArray(active?.tenant) ? active?.tenant[0] : active?.tenant
  return tenant?.id ? { tenantId: tenant.id, userId: user.id } : null
}

async function fetchActiveMembers(tenantId: string) {
  const { data } = await supabase
    .from('tenant_memberships')
    .select('user_id, user:users(first_name, last_name, email)')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .overrideTypes<MemberRow[], { merge: false }>()
  return data ?? []
}

async function fetchActiveShiftRows(tenantId: string) {
  const { data } = await supabase
    .from('shifts')
    .select('id, user_id, started_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .overrideTypes<ShiftRow[], { merge: false }>()
  return data ?? []
}

async function fetchLatestPingRows(tenantId: string, memberIds: string[]) {
  const { data } = await supabase
    .from('location_pings')
    .select('user_id, recorded_at, is_mock')
    .eq('tenant_id', tenantId)
    .in('user_id', memberIds)
    .order('recorded_at', { ascending: false })
    .overrideTypes<PingRow[], { merge: false }>()
  return data ?? []
}

async function fetchLatestEventRows(tenantId: string, memberIds: string[]) {
  const { data } = await supabase
    .from('geofence_events')
    .select('user_id, location:locations(name)')
    .eq('tenant_id', tenantId)
    .in('user_id', memberIds)
    .order('occurred_at', { ascending: false })
    .overrideTypes<EventRow[], { merge: false }>()
  return data ?? []
}

function latestByUser<Row extends { user_id: string }>(rows: Row[]) {
  const latest = new Map<string, Row>()
  for (const row of rows) {
    if (!latest.has(row.user_id)) latest.set(row.user_id, row)
  }
  return latest
}

function statusForMember(ping: PingRow | undefined, hasActiveShift: boolean): TeamStatus {
  if (ping?.is_mock) return 'alert'
  if (!ping) return 'offline'
  const ageMs = Date.now() - new Date(ping.recorded_at).getTime()
  if (hasActiveShift && ageMs <= 5 * 60 * 1000) return 'active'
  if (ageMs < 30 * 60 * 1000) return 'warning'
  return 'offline'
}

function durationLabel(status: TeamStatus, shift: ShiftRow | undefined, ping: PingRow | undefined) {
  if (status === 'active' && shift) return elapsedLabel(shift.started_at)
  return ping ? lastSeenLabel(ping.recorded_at) : null
}

function elapsedLabel(startedAt: string) {
  const totalMinutes = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}ს ${minutes.toString().padStart(2, '0')}წ`
}

function lastSeenLabel(recordedAt: string) {
  const date = new Date(recordedAt)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const time = date.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })
  if (date.toDateString() === now.toDateString()) return time
  if (date.toDateString() === yesterday.toDateString()) return `გუშინ ${time}`
  return date.toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' })
}

function locationName(event: EventRow | undefined) {
  const location = Array.isArray(event?.location) ? event?.location[0] : event?.location
  return location?.name ?? null
}

function displayName(member: MemberRow) {
  return (
    [member.user?.first_name, member.user?.last_name].filter(Boolean).join(' ') ||
    member.user?.email ||
    'Employee'
  )
}

function initials(value: string) {
  return (
    value
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase())
      .filter(Boolean)
      .slice(0, 2)
      .join('') || '?'
  )
}
