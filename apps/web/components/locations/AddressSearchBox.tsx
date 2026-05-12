'use client'

import { Loader2, Search } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

interface GeocodeFeature {
  id: string
  place_name: string
  center: [number, number] // [lng, lat]
}

interface AddressSearchBoxProps {
  /** Restrict results to this ISO country code (default "ge" for Georgia) */
  country?: string
  /** Bias results around this point */
  proximity?: { lat: number; lng: number }
  onSelect: (result: { lat: number; lng: number; placeName: string }) => void
}

const MAPBOX_GEOCODE = 'https://api.mapbox.com/geocoding/v5/mapbox.places'

export function AddressSearchBox({ country = 'ge', proximity, onSelect }: AddressSearchBoxProps) {
  const inputId = useId()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodeFeature[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click-outside
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 3) {
      setResults([])
      setLoading(false)
      return
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      setError('NEXT_PUBLIC_MAPBOX_TOKEN არ არის')
      return
    }

    setLoading(true)
    setError(null)
    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          access_token: token,
          language: 'ka',
          country,
          limit: '5',
        })
        if (proximity) {
          params.set('proximity', `${proximity.lng},${proximity.lat}`)
        }
        const url = `${MAPBOX_GEOCODE}/${encodeURIComponent(trimmed)}.json?${params}`
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error(`Mapbox ${res.status}`)
        const json = (await res.json()) as { features?: GeocodeFeature[] }
        setResults(json.features ?? [])
        setOpen(true)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError('ძებნა ვერ მოხერხდა')
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [query, country, proximity])

  function pick(feature: GeocodeFeature) {
    const [lng, lat] = feature.center
    onSelect({ lat, lng, placeName: feature.place_name })
    setQuery(feature.place_name)
    setOpen(false)
  }

  return (
    <div ref={boxRef} className="relative">
      <label
        htmlFor={inputId}
        className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1"
      >
        მისამართის ძებნა
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="თბილისი, ვაჟა-ფშაველას 76"
          autoComplete="off"
          className="h-9 w-full rounded-[6px] border border-[var(--color-border)] bg-white pl-9 pr-9 text-[13px] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--color-text-tertiary)]" />
        )}
      </div>
      {error && <p className="mt-1 text-[11px] text-[var(--color-error-text)]">{error}</p>}

      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-72 overflow-auto rounded-[6px] border border-[var(--color-border)] bg-white shadow-sm">
          {results.map((feature) => (
            <li key={feature.id}>
              <button
                type="button"
                onClick={() => pick(feature)}
                className="block w-full text-left px-3 py-2 text-[13px] hover:bg-[var(--color-surface)] border-b border-[var(--color-border)] last:border-b-0"
              >
                {feature.place_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
