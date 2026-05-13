import { getCurrentUser } from './auth'
import { supabase } from './supabase'

export interface AdminShift {
  id: string
  user_first_name: string | null
  user_last_name: string | null
  user_email: string
  user_id: string
  started_at: string
  location_name: string | null
}

export interface AdminSnapshot {
  activeShifts: AdminShift[]
  totalMembers: number
}

interface ShiftRow {
  id: string
  started_at: string
  user_id: string
  user: { first_name: string | null; last_name: string | null; email: string | null } | null
}

interface GeofenceEventRow {
  shift_id: string | null
  location: { name: string | null } | null
}

export async function fetchAdminSnapshot(): Promise<AdminSnapshot> {
  const tenantId = await resolveActiveTenantId()
  if (!tenantId) return { activeShifts: [], totalMembers: 0 }

  const [{ count }, { data: shiftRows }] = await Promise.all([
    supabase
      .from('tenant_memberships')
      .select('user_id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
    supabase
      .from('shifts')
      .select('id, started_at, user_id, user:users(first_name, last_name, email)')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .overrideTypes<ShiftRow[], { merge: false }>(),
  ])

  const locationsByShiftId = await fetchLastLocations(
    tenantId,
    (shiftRows ?? []).map((shift) => shift.id),
  )

  return {
    activeShifts: (shiftRows ?? []).map((shift) => ({
      id: shift.id,
      user_first_name: shift.user?.first_name ?? null,
      user_last_name: shift.user?.last_name ?? null,
      user_email: shift.user?.email ?? '',
      user_id: shift.user_id,
      started_at: shift.started_at,
      location_name: locationsByShiftId.get(shift.id) ?? null,
    })),
    totalMembers: count ?? 0,
  }
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

async function fetchLastLocations(tenantId: string, shiftIds: string[]) {
  const namesByShiftId = new Map<string, string>()
  if (shiftIds.length === 0) return namesByShiftId

  const { data } = await supabase
    .from('geofence_events')
    .select('shift_id, location:locations(name)')
    .eq('tenant_id', tenantId)
    .in('shift_id', shiftIds)
    .order('occurred_at', { ascending: false })
    .overrideTypes<GeofenceEventRow[], { merge: false }>()

  for (const event of data ?? []) {
    if (event.shift_id && !namesByShiftId.has(event.shift_id)) {
      namesByShiftId.set(event.shift_id, event.location?.name ?? '')
    }
  }
  return namesByShiftId
}
