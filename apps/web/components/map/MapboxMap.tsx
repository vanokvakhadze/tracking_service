'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl, { type LngLatLike, type Marker } from 'mapbox-gl'
import { useEffect, useRef } from 'react'
import { clearRadiusRings, syncRadiusRings, type RadiusConfig } from './radius-rings'

const TBILISI: LngLatLike = [44.7833, 41.7167]

export interface MarkerSpec {
  id: string
  lat: number
  lng: number
  color?: string
}

interface MapboxMapProps {
  className?: string
  center?: { lat: number; lng: number }
  zoom?: number
  /** Read-only markers — rendered as static pins */
  markers?: MarkerSpec[]
  /** If provided, renders one draggable pin at this position */
  draggablePin?: { lat: number; lng: number }
  /** Called whenever the draggable pin finishes a drag */
  onPinDrag?: (lat: number, lng: number) => void
  /** If both draggablePin and radiusM are provided, draws a translucent
   *  circle around the pin to visualise the geofence */
  radiusM?: RadiusConfig
}

export function MapboxMap({
  className,
  center,
  zoom = 12,
  markers,
  draggablePin,
  onPinDrag,
  radiusM,
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const staticMarkersRef = useRef<Marker[]>([])
  const draggableMarkerRef = useRef<Marker | null>(null)

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      containerRef.current.innerHTML =
        '<div style="padding:24px;font:13px sans-serif;color:#475569">' +
        'NEXT_PUBLIC_MAPBOX_TOKEN არ არის — .env.local-ში ჩასვი.' +
        '</div>'
      return
    }
    mapboxgl.accessToken = token

    const initial: LngLatLike = center ? [center.lng, center.lat] : TBILISI

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initial,
      zoom,
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-centre when the `center` prop changes (e.g. user selects a different
  // location card). flyTo is gentler than setCenter and matches user intent.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !center) return
    map.flyTo({ center: [center.lng, center.lat], zoom, duration: 600 })
  }, [center?.lat, center?.lng, zoom])

  // Sync static markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    for (const m of staticMarkersRef.current) m.remove()
    staticMarkersRef.current = []

    if (!markers) return
    for (const spec of markers) {
      const marker = new mapboxgl.Marker({ color: spec.color ?? '#1565C0' })
        .setLngLat([spec.lng, spec.lat])
        .addTo(map)
      staticMarkersRef.current.push(marker)
    }
  }, [markers])

  // Sync draggable pin
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!draggablePin) {
      draggableMarkerRef.current?.remove()
      draggableMarkerRef.current = null
      return
    }

    if (!draggableMarkerRef.current) {
      const marker = new mapboxgl.Marker({ color: '#1565C0', draggable: Boolean(onPinDrag) })
        .setLngLat([draggablePin.lng, draggablePin.lat])
        .addTo(map)
      marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat()
        onPinDrag?.(lat, lng)
      })
      draggableMarkerRef.current = marker

      // Click anywhere on the map → pin jumps to that spot. Far more
      // discoverable than dragging a tiny marker icon.
      if (onPinDrag) {
        map.getCanvas().style.cursor = 'crosshair'
        map.on('click', (event) => {
          const { lng, lat } = event.lngLat
          marker.setLngLat([lng, lat])
          onPinDrag(lat, lng)
        })
      }
    } else {
      draggableMarkerRef.current.setLngLat([draggablePin.lng, draggablePin.lat])
      draggableMarkerRef.current.setDraggable(Boolean(onPinDrag))
    }
  }, [draggablePin, onPinDrag])

  // Sync radius rings around draggable pin
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!draggablePin || !radiusM) {
      clearRadiusRings(map)
      return
    }

    const apply = () => {
      syncRadiusRings(map, draggablePin, radiusM)
    }

    if (map.isStyleLoaded()) apply()
    else map.once('load', apply)
  }, [draggablePin, radiusM])

  return <div ref={containerRef} className={className} />
}
