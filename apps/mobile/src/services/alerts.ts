import { getCurrentUser } from './auth'
import { supabase } from './supabase'

export type AlertSeverity = 'critical' | 'warning'
export type AlertKind = 'mock_gps' | 'location_disabled' | 'low_battery' | 'out_of_zone'

export interface AdminAlert {
  id: string
  severity: AlertSeverity
  kind: AlertKind
  user_id: string
  user_name: string
  occurred_at: string
  details: Record<string, unknown> | null
}

interface AlertRow {
  id: string
  severity: string
  kind: string
  user_id: string
  user_name: string
  occurred_at: string
  details: unknown
}

export async function fetchAdminAlerts(): Promise<AdminAlert[]> {
  const tenantId = await resolveActiveTenantId()
  if (!tenantId) return []

  const { data, error } = await supabase
    .rpc('get_admin_alerts', { p_tenant_id: tenantId })
    .overrideTypes<AlertRow[], { merge: false }>()

  if (error) return []
  return (data ?? []).map(normalizeAlert).filter((alert): alert is AdminAlert => Boolean(alert))
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

function normalizeAlert(row: AlertRow): AdminAlert | null {
  if (!isSeverity(row.severity) || !isKind(row.kind)) return null
  return {
    id: row.id,
    severity: row.severity,
    kind: row.kind,
    user_id: row.user_id,
    user_name: row.user_name,
    occurred_at: row.occurred_at,
    details: isRecord(row.details) ? row.details : null,
  }
}

function isSeverity(value: string): value is AlertSeverity {
  return value === 'critical' || value === 'warning'
}

function isKind(value: string): value is AlertKind {
  return (
    value === 'mock_gps' ||
    value === 'location_disabled' ||
    value === 'low_battery' ||
    value === 'out_of_zone'
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
