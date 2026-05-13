import { getCurrentUser } from './auth'
import { supabase } from './supabase'

export type TeamStatus = 'active' | 'alert' | 'warning' | 'offline'

export interface TeamPosition {
  user_id: string
  user_name: string
  user_initials: string
  latitude: number
  longitude: number
  recorded_at: string
  status: TeamStatus
}

interface MemberRow {
  user_id: string
  user: { first_name: string | null; last_name: string | null; email: string | null } | null
}

interface PingRow {
  user_id: string
  recorded_at: string
  coords: unknown
  is_mock: boolean | null
}

interface ShiftRow {
  user_id: string
}

export async function fetchTeamPositions(): Promise<TeamPosition[]> {
  const tenantId = await resolveActiveTenantId()
  if (!tenantId) return []

  const memberRows = await fetchActiveMembers(tenantId)
  const memberIds = memberRows.map((member) => member.user_id)
  if (memberIds.length === 0) return []

  const [activeShiftRows, pingRows] = await Promise.all([
    fetchActiveShiftRows(tenantId),
    fetchLatestPingRows(tenantId, memberIds),
  ])
  const activeShiftUserIds = new Set(activeShiftRows.map((shift) => shift.user_id))
  const latestPings = latestPingByUser(pingRows)

  return memberRows
    .map((member) => toTeamPosition(member, latestPings.get(member.user_id), activeShiftUserIds))
    .filter((position): position is TeamPosition => Boolean(position))
}

async function resolveActiveTenantId(): Promise<string | null> {
  const user = await getCurrentUser()
  const memberships = (user?.memberships ?? []) as Array<{
    is_active: boolean | null
    tenant: { id: string } | { id: string }[] | null
  }>
  const active = memberships.find((membership) => membership.is_active)
  const tenant = Array.isArray(active?.tenant) ? active?.tenant[0] : active?.tenant
  return tenant?.id ?? null
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
    .select('user_id')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .overrideTypes<ShiftRow[], { merge: false }>()
  return data ?? []
}

async function fetchLatestPingRows(tenantId: string, memberIds: string[]) {
  const { data } = await supabase
    .from('location_pings')
    .select('user_id, recorded_at, coords, is_mock')
    .eq('tenant_id', tenantId)
    .in('user_id', memberIds)
    .order('recorded_at', { ascending: false })
    .overrideTypes<PingRow[], { merge: false }>()
  return data ?? []
}

function latestPingByUser(rows: PingRow[]) {
  const latest = new Map<string, PingRow>()
  for (const row of rows) {
    if (!latest.has(row.user_id)) latest.set(row.user_id, row)
  }
  return latest
}

function toTeamPosition(
  member: MemberRow,
  ping: PingRow | undefined,
  activeShiftUserIds: Set<string>,
): TeamPosition | null {
  if (!ping) return null
  const point = parsePoint(ping.coords)
  if (!point) return null
  const name = displayName(member)
  return {
    user_id: member.user_id,
    user_name: name,
    user_initials: initials(name),
    latitude: point.latitude,
    longitude: point.longitude,
    recorded_at: ping.recorded_at,
    status: statusForPing(ping, activeShiftUserIds.has(member.user_id)),
  }
}

function statusForPing(ping: PingRow, hasActiveShift: boolean): TeamStatus {
  if (ping.is_mock) return 'alert'
  const ageMs = Date.now() - new Date(ping.recorded_at).getTime()
  if (hasActiveShift && ageMs <= 5 * 60 * 1000) return 'active'
  if (ageMs < 30 * 60 * 1000) return 'warning'
  return 'offline'
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

function parsePoint(coords: unknown): { latitude: number; longitude: number } | null {
  if (typeof coords === 'object' && coords !== null) {
    const maybePoint = coords as { coordinates?: unknown; latitude?: unknown; longitude?: unknown }
    if (Array.isArray(maybePoint.coordinates) && maybePoint.coordinates.length >= 2) {
      return pointFromNumbers(maybePoint.coordinates[1], maybePoint.coordinates[0])
    }
    return pointFromNumbers(maybePoint.latitude, maybePoint.longitude)
  }
  if (typeof coords !== 'string') return null
  return parsePointText(coords) ?? parsePointHex(coords)
}

function parsePointText(value: string) {
  const match = value.match(/POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i)
  if (!match) return null
  return pointFromNumbers(Number(match[2]), Number(match[1]))
}

function parsePointHex(value: string) {
  if (!/^[\da-f]+$/i.test(value) || value.length < 42) return null
  const bytes = value.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16))
  if (!bytes) return null
  const view = new DataView(new Uint8Array(bytes).buffer)
  const littleEndian = view.getUint8(0) === 1
  const type = view.getUint32(1, littleEndian)
  let offset = type & 0x20000000 ? 9 : 5
  if ((type & 0xff) !== 1 || bytes.length < offset + 16) return null
  const longitude = view.getFloat64(offset, littleEndian)
  offset += 8
  const latitude = view.getFloat64(offset, littleEndian)
  return pointFromNumbers(latitude, longitude)
}

function pointFromNumbers(latitude: unknown, longitude: unknown) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return { latitude, longitude }
}
