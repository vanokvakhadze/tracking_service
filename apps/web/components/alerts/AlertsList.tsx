'use client'

import { ArrowRight, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlertCard } from './AlertCard'

export type AlertKind = 'all' | 'mock_gps' | 'location_disabled' | 'low_battery' | 'out_of_zone'
export type AlertSeverity = 'critical' | 'warning'

export interface AdminAlert {
  id: string
  severity: AlertSeverity
  kind: Exclude<AlertKind, 'all'>
  user_id: string
  user_name: string
  occurred_at: string
  details: Record<string, unknown> | null
}

interface AlertsListProps {
  alerts: AdminAlert[]
  pendingLocationsCount: number
}

const STORAGE_KEY = 'trackpro:alerts:last_seen'

const FILTERS: { key: AlertKind; label: string }[] = [
  { key: 'all', label: 'ყველა' },
  { key: 'mock_gps', label: 'Mock GPS' },
  { key: 'location_disabled', label: 'ლოკაცია' },
  { key: 'low_battery', label: 'ბატარეა' },
  { key: 'out_of_zone', label: 'ზონის გარეთ' },
]

export function AlertsList({ alerts, pendingLocationsCount }: AlertsListProps) {
  const [filter, setFilter] = useState<AlertKind>('all')
  const [lastSeenAt, setLastSeenAt] = useState<number | null>(null)

  useEffect(() => {
    function syncLastSeen() {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      setLastSeenAt(stored ? Number(stored) : null)
    }

    syncLastSeen()
    window.addEventListener('storage', syncLastSeen)
    window.addEventListener('trackpro:alerts-seen', syncLastSeen)
    return () => {
      window.removeEventListener('storage', syncLastSeen)
      window.removeEventListener('trackpro:alerts-seen', syncLastSeen)
    }
  }, [])

  const counts = useMemo(() => {
    return FILTERS.reduce<Record<AlertKind, number>>(
      (acc, item) => {
        acc[item.key] =
          item.key === 'all'
            ? alerts.length
            : alerts.filter((alert) => alert.kind === item.key).length
        return acc
      },
      { all: 0, mock_gps: 0, location_disabled: 0, low_battery: 0, out_of_zone: 0 },
    )
  }, [alerts])

  const visibleAlerts = filter === 'all' ? alerts : alerts.filter((alert) => alert.kind === filter)
  const criticalAlerts = visibleAlerts.filter((alert) => alert.severity === 'critical')
  const warningAlerts = visibleAlerts.filter((alert) => alert.severity === 'warning')

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => {
          const active = filter === item.key
          return (
            <button
              className={
                active
                  ? 'inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3 text-[12px] font-semibold text-white'
                  : 'inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-3 text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
              }
              key={item.key}
              onClick={() => setFilter(item.key)}
              type="button"
            >
              {item.label}
              <span
                className={
                  active
                    ? 'rounded-full bg-white/20 px-1.5 text-[10px] font-bold text-white'
                    : 'rounded-full bg-[var(--color-surface-2)] px-1.5 text-[10px] font-bold text-[var(--color-text-secondary)]'
                }
              >
                {counts[item.key]}
              </span>
            </button>
          )
        })}
      </div>

      {pendingLocationsCount > 0 && (
        <Link
          className="flex items-center justify-between rounded-[8px] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-5 py-4 transition-colors hover:bg-[var(--color-surface)]"
          href="/locations/pending"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-[8px] bg-white text-[var(--color-warning-text)]">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                {pendingLocationsCount} ლოკაცია მოლოდინში
              </p>
              <p className="text-[12px] text-[var(--color-text-secondary)]">
                თანამშრომლების მიერ შემოგზავნილი - დასამტკიცებელია
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[var(--color-text-tertiary)]" />
        </Link>
      )}

      {visibleAlerts.length === 0 ? (
        <div className="rounded-[8px] border border-[var(--color-border)] bg-white p-8 text-center">
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            ამ კატეგორიაში ალერტი არ არის
          </p>
        </div>
      ) : (
        <>
          <AlertSection alerts={criticalAlerts} lastSeenAt={lastSeenAt} title="კრიტიკული" />
          <AlertSection alerts={warningAlerts} lastSeenAt={lastSeenAt} title="გაფრთხილება" />
        </>
      )}
    </>
  )
}

function AlertSection({
  alerts,
  lastSeenAt,
  title,
}: {
  alerts: AdminAlert[]
  lastSeenAt: number | null
  title: string
}) {
  if (alerts.length === 0) return null

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">
          {title}
        </h2>
        <span className="rounded-full border border-[var(--color-border)] bg-white px-2 py-0.5 text-[11px] font-semibold text-[var(--color-text-secondary)]">
          {alerts.length}
        </span>
      </div>
      <ul className="space-y-3">
        {alerts.map((alert) => (
          <AlertCard
            alert={alert}
            dim={lastSeenAt !== null && new Date(alert.occurred_at).getTime() <= lastSeenAt}
            key={alert.id}
          />
        ))}
      </ul>
    </section>
  )
}
