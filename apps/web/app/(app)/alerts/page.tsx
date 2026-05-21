import { type AdminAlert, AlertsList } from '@/components/alerts/AlertsList'
import { MarkSeenButton } from '@/components/alerts/MarkSeenButton'
import { SubHeader } from '@/components/layout/SubHeader'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type AlertKind = 'mock_gps' | 'location_disabled' | 'low_battery' | 'out_of_zone'
type AlertSeverity = 'critical' | 'warning'

interface AdminAlertRow {
  id: string
  severity: string
  kind: string
  user_id: string
  user_name: string
  occurred_at: string
  details: Record<string, unknown> | null
}

const ALERT_KINDS: AlertKind[] = ['mock_gps', 'location_disabled', 'low_battery', 'out_of_zone']

export default async function AlertsPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const membership = me.memberships?.find((item) => item.is_active)
  const tenantId = membership?.tenant?.id
  const isAdmin = membership && ['tenant_admin', 'super_admin'].includes(membership.role)

  if (!tenantId) {
    return (
      <>
        <SubHeader title="ალერტი" />
        <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
          აქტიური workspace ვერ მოიძებნა.
        </main>
      </>
    )
  }

  if (!isAdmin) {
    return (
      <>
        <SubHeader title="ალერტი" />
        <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
          ალერტების ნახვა მხოლოდ admin-ს შეუძლია.
        </main>
      </>
    )
  }

  const supabase = await createClient()
  const [{ data: alertRows }, { count: pendingCount }] = await Promise.all([
    supabase
      .rpc('get_admin_alerts', { p_tenant_id: tenantId })
      .overrideTypes<AdminAlertRow[], { merge: false }>(),
    supabase
      .from('locations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'pending_approval')
      .is('deleted_at', null),
  ])

  const alerts = (alertRows ?? []).filter(isValidAlert).map((row) => ({
    ...row,
    severity: row.severity,
    kind: row.kind,
  }))
  const totalPending = pendingCount ?? 0
  const todaysAlerts = alerts.filter((alert) => isToday(alert.occurred_at)).length

  return (
    <>
      <SubHeader
        actions={<MarkSeenButton />}
        title="ალერტი"
        subtitle={`${alerts.length} აქტიური · ${todaysAlerts} დღევანდელი · ${totalPending} ლოკაცია მოლოდინში`}
      />

      <main className="space-y-6 p-6">
        <AlertsList alerts={alerts} pendingLocationsCount={totalPending} />
      </main>
    </>
  )
}

function isValidAlert(row: AdminAlertRow): row is AdminAlert {
  const validSeverity = row.severity === 'critical' || row.severity === 'warning'
  const validKind = ALERT_KINDS.includes(row.kind as AlertKind)
  return validSeverity && validKind
}

function isToday(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}
