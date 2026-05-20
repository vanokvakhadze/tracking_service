'use client'

import { CheckCircle2, Clock, MapPin } from 'lucide-react'
import { useMemo } from 'react'
import { MapboxMap, type MarkerSpec } from '@/components/map/MapboxMap'
import type { LiveMapLocation, TrackerVM } from './types'

const STATUS_COLORS = {
  active: '#16A34A',
  idle: '#CA8A04',
  off: '#94A3B8',
} as const

const LOCATION_COLOR = '#1565C0'

interface Props {
  trackers: TrackerVM[]
  locations: LiveMapLocation[]
  selectedId: string | null
}

export function MapStage({ trackers, locations, selectedId }: Props) {
  const markers = useMemo<MarkerSpec[]>(() => {
    const locationMarkers = locations
      .filter(
        (l): l is LiveMapLocation & { latitude: number; longitude: number } =>
          l.latitude !== null && l.longitude !== null,
      )
      .map<MarkerSpec>((l) => ({
        id: `loc:${l.id}`,
        lat: l.latitude,
        lng: l.longitude,
        color: LOCATION_COLOR,
      }))

    const trackerMarkers = trackers
      .filter(
        (t): t is TrackerVM & { lat: number; lng: number } => t.lat !== null && t.lng !== null,
      )
      .map<MarkerSpec>((t) => ({
        id: `trk:${t.id}`,
        lat: t.lat,
        lng: t.lng,
        color: STATUS_COLORS[t.status],
      }))

    return [...locationMarkers, ...trackerMarkers]
  }, [trackers, locations])

  const center = useMemo(() => {
    if (selectedId) {
      const selected = trackers.find((t) => t.id === selectedId)
      if (selected?.lat != null && selected.lng != null) {
        return { lat: selected.lat, lng: selected.lng }
      }
    }
    const firstLocation = locations.find(
      (l): l is LiveMapLocation & { latitude: number; longitude: number } =>
        l.latitude !== null && l.longitude !== null,
    )
    return firstLocation ? { lat: firstLocation.latitude, lng: firstLocation.longitude } : undefined
  }, [trackers, locations, selectedId])

  const counts = useMemo(
    () => ({
      active: trackers.filter((t) => t.status === 'active').length,
      idle: trackers.filter((t) => t.status === 'idle').length,
      locations: locations.filter((l) => l.is_active).length,
    }),
    [trackers, locations],
  )

  return (
    <div className="relative flex-1 overflow-hidden">
      <MapboxMap className="h-full w-full" center={center} zoom={12} markers={markers} />

      <div className="pointer-events-none absolute left-4 top-4 z-10 flex gap-2">
        <StatPill
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          label="აქტიური"
          value={counts.active}
          tone="success"
        />
        <StatPill
          icon={<Clock className="h-3.5 w-3.5" />}
          label="დაყოვნება"
          value={counts.idle}
          tone="warning"
        />
        <StatPill
          icon={<MapPin className="h-3.5 w-3.5" />}
          label="ლოკაცია"
          value={counts.locations}
          tone="accent"
        />
      </div>
    </div>
  )
}

function StatPill({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'success' | 'warning' | 'accent'
}) {
  const styles = {
    success: { bg: 'var(--color-success-bg)', text: 'var(--color-success)' },
    warning: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)' },
    accent: { bg: 'var(--color-accent-tint)', text: 'var(--color-accent)' },
  }[tone]

  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
      <span
        className="grid h-[22px] w-[22px] place-items-center rounded"
        style={{ backgroundColor: styles.bg, color: styles.text }}
      >
        {icon}
      </span>
      <div className="leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--color-text-tertiary)]">
          {label}
        </p>
        <p className="text-[14px] font-bold tabular-nums text-[var(--color-text-primary)]">
          {value}
        </p>
      </div>
    </div>
  )
}
