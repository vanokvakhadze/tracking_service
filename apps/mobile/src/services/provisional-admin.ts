import { supabase } from './supabase'

export interface PendingSubmission {
  id: string
  photoSignedUrl: string | null
  employeeName: string
  employeeInitials: string
  latitude: number
  longitude: number
  submittedAt: string | null
  distanceToNearestM: number | null
  noteFromEmployee: string | null
}

interface PendingRow {
  id: string
  name: string | null
  photo_url: string | null
  latitude: number | null
  longitude: number | null
  submitted_at: string | null
  created_at: string | null
  created_by:
    | { first_name: string | null; last_name: string | null; email: string | null }
    | { first_name: string | null; last_name: string | null; email: string | null }[]
    | null
}

interface ActiveCoordRow {
  latitude: number | null
  longitude: number | null
}

async function resolveActiveTenantId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('tenant_memberships')
    .select('tenant_id, is_active')
    .eq('user_id', user.id)
  const active = (data ?? []).find((row) => row.is_active)
  return active?.tenant_id ?? null
}

export async function fetchPendingSubmissions(): Promise<PendingSubmission[]> {
  const tenantId = await resolveActiveTenantId()
  if (!tenantId) return []

  const [{ data: rows }, { data: activeRows }] = await Promise.all([
    supabase
      .from('locations')
      .select(
        'id, name, photo_url, latitude, longitude, submitted_at, created_at, created_by:users!locations_created_by_user_id_fkey(first_name, last_name, email)',
      )
      .eq('tenant_id', tenantId)
      .eq('status', 'pending_approval')
      .is('deleted_at', null)
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .overrideTypes<PendingRow[], { merge: false }>(),
    supabase
      .from('locations')
      .select('latitude, longitude')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .overrideTypes<ActiveCoordRow[], { merge: false }>(),
  ])

  const activeCoords = (activeRows ?? []).filter(
    (row): row is { latitude: number; longitude: number } =>
      row.latitude !== null && row.longitude !== null,
  )

  const submissions = await Promise.all(
    (rows ?? [])
      .filter(
        (row): row is PendingRow & { latitude: number; longitude: number } =>
          row.latitude !== null && row.longitude !== null,
      )
      .map(async (row) => toSubmission(row, activeCoords)),
  )

  return submissions
}

export async function fetchPendingSubmission(id: string): Promise<PendingSubmission | null> {
  const all = await fetchPendingSubmissions()
  return all.find((s) => s.id === id) ?? null
}

export async function approveLocation(id: string, name: string): Promise<void> {
  const trimmed = name.trim()
  if (trimmed.length < 2) throw new Error('სახელი მინიმუმ 2 სიმბოლო უნდა იყოს')
  const { error } = await supabase.rpc('approve_location', {
    p_id: id,
    p_name: trimmed,
  })
  if (error) throw new Error(error.message)
}

export async function rejectLocation(id: string, reason: string): Promise<void> {
  const trimmed = reason.trim()
  if (trimmed.length < 2) throw new Error('მიზეზი მინიმუმ 2 სიმბოლო უნდა იყოს')
  const { error } = await supabase.rpc('reject_location', {
    p_id: id,
    p_reason: trimmed,
  })
  if (error) throw new Error(error.message)
}

async function toSubmission(
  row: PendingRow & { latitude: number; longitude: number },
  activeCoords: { latitude: number; longitude: number }[],
): Promise<PendingSubmission> {
  const user = Array.isArray(row.created_by) ? row.created_by[0] : row.created_by
  const employeeName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'Employee'
  const employeeInitials =
    employeeName
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase())
      .filter(Boolean)
      .slice(0, 2)
      .join('') || 'E'

  let photoSignedUrl: string | null = null
  if (row.photo_url) {
    if (row.photo_url.startsWith('http')) {
      photoSignedUrl = row.photo_url
    } else {
      const { data } = await supabase.storage
        .from('provisional-photos')
        .createSignedUrl(row.photo_url, 600)
      photoSignedUrl = data?.signedUrl ?? null
    }
  }

  return {
    id: row.id,
    photoSignedUrl,
    employeeName,
    employeeInitials,
    latitude: row.latitude,
    longitude: row.longitude,
    submittedAt: row.submitted_at ?? row.created_at,
    distanceToNearestM: nearestDistance(row, activeCoords),
    noteFromEmployee: row.name,
  }
}

function nearestDistance(
  row: { latitude: number; longitude: number },
  active: { latitude: number; longitude: number }[],
) {
  if (active.length === 0) return null
  return Math.round(
    Math.min(
      ...active.map((loc) =>
        haversineMeters(row.latitude, row.longitude, loc.latitude, loc.longitude),
      ),
    ),
  )
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
