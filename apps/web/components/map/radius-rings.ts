import type mapboxgl from 'mapbox-gl'

export type RadiusConfig = number | { trigger: number; boundary: number }

const RADIUS_RINGS = {
  boundary: {
    fillLayerId: 'geofence-boundary-fill',
    lineLayerId: 'geofence-boundary-line',
    sourceId: 'geofence-boundary-source',
    color: '#CA8A04',
    fillOpacity: 0.11,
  },
  trigger: {
    fillLayerId: 'geofence-trigger-fill',
    lineLayerId: 'geofence-trigger-line',
    sourceId: 'geofence-trigger-source',
    color: '#1565C0',
    fillOpacity: 0.2,
  },
} as const

export function clearRadiusRings(map: mapboxgl.Map) {
  removeRadiusRing(map, RADIUS_RINGS.trigger)
  removeRadiusRing(map, RADIUS_RINGS.boundary)
}

export function syncRadiusRings(
  map: mapboxgl.Map,
  center: { lat: number; lng: number },
  radiusM: RadiusConfig,
) {
  const rings = normalizeRadiusRings(radiusM)
  const activeKeys = new Set(rings.map((ring) => ring.key))
  for (const key of ['boundary', 'trigger'] as const) {
    if (!activeKeys.has(key)) removeRadiusRing(map, RADIUS_RINGS[key])
  }
  for (const ring of rings) {
    upsertRadiusRing(map, center, ring)
  }
}

function normalizeRadiusRings(radiusM: RadiusConfig) {
  if (typeof radiusM === 'number') return [{ key: 'trigger' as const, radius: radiusM }]
  return [
    { key: 'boundary' as const, radius: radiusM.boundary },
    { key: 'trigger' as const, radius: radiusM.trigger },
  ]
}

function upsertRadiusRing(
  map: mapboxgl.Map,
  center: { lat: number; lng: number },
  ring: ReturnType<typeof normalizeRadiusRings>[number],
) {
  const style = RADIUS_RINGS[ring.key]
  const circle = makeCirclePolygon(center.lng, center.lat, ring.radius)
  const existing = map.getSource(style.sourceId) as mapboxgl.GeoJSONSource | undefined
  if (existing) existing.setData(circle)
  else map.addSource(style.sourceId, { type: 'geojson', data: circle })

  if (!map.getLayer(style.fillLayerId)) {
    map.addLayer({
      id: style.fillLayerId,
      type: 'fill',
      source: style.sourceId,
      paint: { 'fill-color': style.color, 'fill-opacity': style.fillOpacity },
    })
  }
  if (!map.getLayer(style.lineLayerId)) {
    map.addLayer({
      id: style.lineLayerId,
      type: 'line',
      source: style.sourceId,
      paint: {
        'line-color': style.color,
        'line-dasharray': [2, 2],
        'line-opacity': 0.9,
        'line-width': 2,
      },
    })
  }
}

function removeRadiusRing(
  map: mapboxgl.Map,
  ring: (typeof RADIUS_RINGS)[keyof typeof RADIUS_RINGS],
) {
  if (map.getLayer(ring.lineLayerId)) map.removeLayer(ring.lineLayerId)
  if (map.getLayer(ring.fillLayerId)) map.removeLayer(ring.fillLayerId)
  if (map.getSource(ring.sourceId)) map.removeSource(ring.sourceId)
}

/** Build a 64-point approximation of a circle of `radiusMeters` around (lng, lat). */
function makeCirclePolygon(
  lng: number,
  lat: number,
  radiusMeters: number,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const points = 64
  const coords: [number, number][] = []
  const earthRadius = 6378137
  const latRad = (lat * Math.PI) / 180
  const dLat = (radiusMeters / earthRadius) * (180 / Math.PI)
  const dLng = ((radiusMeters / earthRadius) * (180 / Math.PI)) / Math.cos(latRad)
  for (let i = 0; i <= points; i++) {
    const theta = (i / points) * 2 * Math.PI
    coords.push([lng + dLng * Math.cos(theta), lat + dLat * Math.sin(theta)])
  }
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties: {} }
}
