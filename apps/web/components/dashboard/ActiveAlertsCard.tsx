import { AlertTriangle, BatteryLow, MapPinOff, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

type AlertKind = 'mock_gps' | 'location_disabled' | 'low_battery' | 'out_of_zone'
type AlertSeverity = 'critical' | 'warning'

export interface DashboardAlert {
  id: string
  severity: AlertSeverity
  kind: AlertKind
  user_name: string
  occurred_at: string
}

const labels: Record<AlertKind, string> = {
  mock_gps: 'Mock GPS',
  location_disabled: 'ლოკაცია გათიშულია',
  low_battery: 'დაბალი ბატარეა',
  out_of_zone: 'ზონის გარეთ',
}

const icons: Record<AlertKind, typeof AlertTriangle> = {
  mock_gps: ShieldAlert,
  location_disabled: MapPinOff,
  low_battery: BatteryLow,
  out_of_zone: AlertTriangle,
}

export function ActiveAlertsCard({ alerts }: { alerts: DashboardAlert[] }) {
  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-3">
        <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">
          აქტიური ალერტი · {alerts.length}
        </h2>
        <Link className="text-[12px] font-semibold text-[var(--color-accent)]" href="/alerts">
          ყველა alerts →
        </Link>
      </div>
      <div className="p-5">
        {alerts.length === 0 ? (
          <div className="grid min-h-[220px] place-items-center text-center">
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              ალერტი არ არის. გუნდი ნორმალურად მუშაობს.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {alerts.slice(0, 3).map((alert) => {
              const Icon = icons[alert.kind]
              const critical = alert.severity === 'critical'
              return (
                <li
                  className={
                    critical
                      ? 'rounded-[8px] border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3'
                      : 'rounded-[8px] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-3'
                  }
                  key={alert.id}
                >
                  <div className="flex gap-3">
                    <span
                      className={
                        critical
                          ? 'grid h-8 w-8 shrink-0 place-items-center rounded-[6px] bg-white text-[var(--color-error-text)]'
                          : 'grid h-8 w-8 shrink-0 place-items-center rounded-[6px] bg-white text-[var(--color-warning-text)]'
                      }
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">
                        {labels[alert.kind]}
                      </p>
                      <p className="truncate text-[11px] text-[var(--color-text-secondary)]">
                        {alert.user_name}
                      </p>
                      <p className="mt-0.5 text-[10px] tabular-nums text-[var(--color-text-tertiary)]">
                        {formatTime(alert.occurred_at)}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('ka-GE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
