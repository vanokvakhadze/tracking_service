'use client'

import { MapboxMap, type MarkerSpec } from '@/components/map/MapboxMap'
import type { LocationRow } from '@/components/locations/types'

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
      color: l.is_active ? '#1565C0' : '#94A3B8',
    }))

  const center = markers.length > 0 ? { lat: markers[0]!.lat, lng: markers[0]!.lng } : undefined

  return <MapboxMap className="h-[360px] w-full" center={center} zoom={12} markers={markers} />
}
