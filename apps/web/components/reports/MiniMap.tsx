'use client'

import { MapboxMap, type MarkerSpec } from '@/components/map/MapboxMap'
import Link from 'next/link'

export interface MiniMapLocation {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  is_active: boolean | null
}

export function MiniMap({ locations }: { locations: MiniMapLocation[] }) {
  const markers: MarkerSpec[] = locations
    .filter(
      (location): location is MiniMapLocation & { latitude: number; longitude: number } =>
        location.latitude !== null && location.longitude !== null,
    )
    .map((location) => ({
      id: location.id,
      lat: location.latitude,
      lng: location.longitude,
      color: location.is_active ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
    }))
  const center = markers.length > 0 ? { lat: markers[0]!.lat, lng: markers[0]!.lng } : undefined

  return (
    <section className="overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-3">
        <div>
          <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">Mini map</h2>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
            {markers.length} marker
          </p>
        </div>
        <Link className="text-[12px] font-semibold text-[var(--color-accent)]" href="/live-map">
          live map →
        </Link>
      </div>
      <MapboxMap center={center} className="h-[260px] w-full" markers={markers} zoom={11} />
    </section>
  )
}
