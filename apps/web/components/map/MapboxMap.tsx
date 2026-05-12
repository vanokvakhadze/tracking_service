'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl, { type LngLatLike, type Marker } from 'mapbox-gl'
import { useEffect, useRef } from 'react'

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
  radiusM?: number
}

const RADIUS_LAYER_ID = 'geofence-radius'
const RADIUS_SOURCE_ID = 'geofence-radius-source'

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
      const marker = new mapboxgl.Marker({ color: '#1565C0', draggable: true })
        .setLngLat([draggablePin.lng, draggablePin.lat])
        .addTo(map)
      marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat()
        onPinDrag?.(lat, lng)
      })
      draggableMarkerRef.current = marker

      // Click anywhere on the map → pin jumps to that spot. Far more
      // discoverable than dragging a tiny marker icon.
      map.getCanvas().style.cursor = 'crosshair'
      map.on('click', (event) => {
        const { lng, lat } = event.lngLat
        marker.setLngLat([lng, lat])
        onPinDrag?.(lat, lng)
      })
    } else {
      draggableMarkerRef.current.setLngLat([draggablePin.lng, draggablePin.lat])
    }
  }, [draggablePin, onPinDrag])

  // Sync radius ring around draggable pin
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!draggablePin || !radiusM) {
      if (map.getLayer(RADIUS_LAYER_ID)) map.removeLayer(RADIUS_LAYER_ID)
      if (map.getSource(RADIUS_SOURCE_ID)) map.removeSource(RADIUS_SOURCE_ID)
      return
    }

    const circle = makeCirclePolygon(draggablePin.lng, draggablePin.lat, radiusM)
    const apply = () => {
      const existing = map.getSource(RADIUS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
      if (existing) {
        existing.setData(circle)
        return
      }
      map.addSource(RADIUS_SOURCE_ID, { type: 'geojson', data: circle })
      map.addLayer({
        id: RADIUS_LAYER_ID,
        type: 'fill',
        source: RADIUS_SOURCE_ID,
        paint: {
          'fill-color': '#1565C0',
          'fill-opacity': 0.15,
          'fill-outline-color': '#1565C0',
        },
      })
    }

    if (map.isStyleLoaded()) apply()
    else map.once('load', apply)
  }, [draggablePin, radiusM])

  return <div ref={containerRef} className={className} />
}

/** Build a 64-point approximation of a circle of `radiusMeters` around (lng, lat). */
function makeCirclePolygon(
  lng: number,
  lat: number,
  radiusMeters: number,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const points = 64
  const coords: [number, number][] = []
  const earthRadius = 6378137 // meters
  const latRad = (lat * Math.PI) / 180
  const dLat = (radiusMeters / earthRadius) * (180 / Math.PI)
  const dLng = ((radiusMeters / earthRadius) * (180 / Math.PI)) / Math.cos(latRad)
  for (let i = 0; i <= points; i++) {
    const theta = (i / points) * 2 * Math.PI
    coords.push([lng + dLng * Math.cos(theta), lat + dLat * Math.sin(theta)])
  }
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  }
}
