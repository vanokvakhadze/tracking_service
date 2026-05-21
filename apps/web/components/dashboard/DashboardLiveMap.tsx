'use client'

import type { LocationRow } from '@/components/locations/types'
import { MapboxMap, type MarkerSpec } from '@/components/map/MapboxMap'

interface DashboardLiveMapProps {
  locations: LocationRow[]
}

export function DashboardLiveMap({ locations }: DashboardLiveMapProps) {
  const markers: MarkerSpec[] = locations
    .filter(
      (l): l is LocationRow & { latitude: number; longitude: number } =>
        l.latitude !== null && l.longitude !== null,
    )
    .map((l) => ({
      id: l.id,
      lat: l.latitude,
      lng: l.longitude,
      color: l.is_active ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
    }))

  const center = markers.length > 0 ? { lat: markers[0]!.lat, lng: markers[0]!.lng } : undefined

  return <MapboxMap className="h-[360px] w-full" center={center} zoom={12} markers={markers} />
}
