import { AlertTriangle, BatteryLow, MapPinOff, ShieldAlert, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SubHeader } from '@/components/layout/SubHeader'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

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

const ALERT_LABELS: Record<AlertKind, string> = {
  mock_gps: 'Mock GPS — ცრუ ლოკაცია',
  location_disabled: 'ლოკაცია გათიშულია',
  low_battery: 'დაბალი ბატარეა',
  out_of_zone: 'სამუშაო ზონის გარეთ',
}

const ALERT_ICONS: Record<AlertKind, typeof AlertTriangle> = {
  mock_gps: ShieldAlert,
  location_disabled: MapPinOff,
  low_battery: BatteryLow,
  out_of_zone: AlertTriangle,
}

export default async function AlertsPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const membership = me.memberships?.find((m) => m.is_active)
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

  const alerts = (alertRows ?? []).filter(isValidAlert)
  const critical = alerts.filter((a) => a.severity === 'critical')
  const warnings = alerts.filter((a) => a.severity === 'warning')
  const totalPending = pendingCount ?? 0

  return (
    <>
      <SubHeader
        title="ალერტი"
        subtitle={`${alerts.length} შეტყობინება · ${totalPending} მოლოდინში`}
      />

      <main className="p-6 space-y-6">
        {totalPending > 0 && (
          <Link
            href="/locations/pending"
            className="flex items-center justify-between rounded-[8px] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-5 py-4 transition-colors hover:bg-[var(--color-warning-bg-hover,_var(--color-warning-bg))]"
          >
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[var(--color-warning-text)]" />
              <div>
                <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                  {totalPending} ლოკაცია მოლოდინში
                </p>
                <p className="text-[12px] text-[var(--color-text-secondary)]">
                  თანამშრომელთა მიერ შემოგზავნილი — დასამტკიცებელია
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--color-text-tertiary)]" />
          </Link>
        )}

        <AlertSection
          title="კრიტიკული"
          tone="critical"
          alerts={critical}
          emptyMessage="კრიტიკული ალერტი არ არის."
        />

        <AlertSection
          title="გაფრთხილებები"
          tone="warning"
          alerts={warnings}
          emptyMessage="გაფრთხილებები არ არის."
        />
      </main>
    </>
  )
}

interface AdminAlert {
  id: string
  severity: AlertSeverity
  kind: AlertKind
  user_id: string
  user_name: string
  occurred_at: string
  details: Record<string, unknown> | null
}

function AlertSection({
  title,
  tone,
  alerts,
  emptyMessage,
}: {
  title: string
  tone: AlertSeverity
  alerts: AdminAlert[]
  emptyMessage: string
}) {
  return (
    <section>
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">
        {title} ({alerts.length})
      </h2>
      {alerts.length === 0 ? (
        <div className="rounded-[8px] border border-[var(--color-border)] bg-white p-8 text-center">
          <p className="text-[13px] text-[var(--color-text-secondary)]">{emptyMessage}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} tone={tone} />
          ))}
        </ul>
      )}
    </section>
  )
}

function AlertRow({ alert, tone }: { alert: AdminAlert; tone: AlertSeverity }) {
  const Icon = ALERT_ICONS[alert.kind]
  const isCritical = tone === 'critical'
  const accentColor = isCritical ? 'var(--color-error)' : 'var(--color-warning)'
  const detail = formatDetail(alert)

  return (
    <li
      className="flex items-start gap-3 rounded-[8px] border border-[var(--color-border)] bg-white p-4"
      style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
        style={{
          backgroundColor: isCritical
            ? 'var(--color-error-bg, rgba(239,68,68,0.1))'
            : 'var(--color-warning-bg)',
          color: accentColor,
        }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
          {ALERT_LABELS[alert.kind]}
        </p>
        <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
          {alert.user_name}
          {detail && <span className="text-[var(--color-text-tertiary)]"> · {detail}</span>}
        </p>
        <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
          {formatTimestamp(alert.occurred_at)}
        </p>
      </div>
    </li>
  )
}

function isValidAlert(row: AdminAlertRow): row is AdminAlertRow & {
  severity: AlertSeverity
  kind: AlertKind
} {
  const validSeverity = row.severity === 'critical' || row.severity === 'warning'
  const validKind = (Object.keys(ALERT_LABELS) as string[]).includes(row.kind)
  return validSeverity && validKind
}

function formatDetail(alert: AdminAlert) {
  if (!alert.details) return null
  switch (alert.kind) {
    case 'low_battery': {
      const pct = alert.details.battery_percent
      return typeof pct === 'number' ? `${pct}%` : null
    }
    case 'out_of_zone': {
      const name = alert.details.location_name
      return typeof name === 'string' ? name : null
    }
    case 'mock_gps': {
      const acc = alert.details.accuracy_m
      return typeof acc === 'number' ? `accuracy ${Math.round(acc)}მ` : null
    }
    default:
      return null
  }
}

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat('ka-GE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
