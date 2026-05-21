import { AlertTriangle, BatteryLow, MapPinOff, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import type { AdminAlert, AlertKind } from './AlertsList'

const ALERT_LABELS: Record<Exclude<AlertKind, 'all'>, string> = {
  mock_gps: 'Mock GPS - ცრუ ლოკაცია',
  location_disabled: 'ლოკაცია გათიშულია',
  low_battery: 'დაბალი ბატარეა',
  out_of_zone: 'სამუშაო ზონის გარეთ',
}

const ALERT_ICONS: Record<Exclude<AlertKind, 'all'>, typeof AlertTriangle> = {
  mock_gps: ShieldAlert,
  location_disabled: MapPinOff,
  low_battery: BatteryLow,
  out_of_zone: AlertTriangle,
}

interface AlertCardProps {
  alert: AdminAlert
  dim: boolean
}

export function AlertCard({ alert, dim }: AlertCardProps) {
  const Icon = ALERT_ICONS[alert.kind]
  const isCritical = alert.severity === 'critical'
  const detail = formatDetail(alert)

  return (
    <li
      className={
        isCritical
          ? `rounded-[8px] border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-4 transition-opacity ${dim ? 'opacity-55' : 'opacity-100'}`
          : `rounded-[8px] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-4 transition-opacity ${dim ? 'opacity-55' : 'opacity-100'}`
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            isCritical
              ? 'grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-white text-[var(--color-error-text)]'
              : 'grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-white text-[var(--color-warning-text)]'
          }
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
            {ALERT_LABELS[alert.kind]}
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
            {alert.user_name}
            {detail && <span className="text-[var(--color-text-tertiary)]"> · {detail}</span>}
          </p>
          <p className="mt-1 text-[11px] tabular-nums text-[var(--color-text-tertiary)]">
            {formatTimestamp(alert.occurred_at)}
          </p>
          {isCritical && (
            <Link
              className="mt-3 inline-flex h-7 items-center rounded-[4px] bg-[var(--color-accent)] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
              href="/users"
            >
              ნახე დეტალები
            </Link>
          )}
        </div>
      </div>
    </li>
  )
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
    case 'location_disabled': {
      const permission = alert.details.has_permission
      return permission === false ? 'permission off' : null
    }
  }
}

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat('ka-GE', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(iso))
}
