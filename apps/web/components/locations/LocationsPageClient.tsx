'use client'

import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { SubHeader } from '@/components/layout/SubHeader'
import { Button } from '@/components/ui/Button'
import { MapboxMap, type MarkerSpec } from '@/components/map/MapboxMap'
import { LocationsList } from './LocationsList'
import { type LocationCategory, type LocationRow, categoryLabels } from './types'

interface LocationsPageClientProps {
  initialRows: LocationRow[]
}

type CategoryFilter = 'all' | LocationCategory

export function LocationsPageClient({ initialRows }: LocationsPageClientProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(initialRows[0]?.id ?? null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return initialRows.filter((row) => {
      if (category !== 'all' && row.category !== category) return false
      if (!q) return true
      const haystack = [row.name, row.address].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [initialRows, search, category])

  const selected = useMemo(
    () => filtered.find((r) => r.id === selectedId) ?? null,
    [filtered, selectedId],
  )

  const markers: MarkerSpec[] = useMemo(
    () =>
      filtered
        .filter(
          (r): r is LocationRow & { latitude: number; longitude: number } =>
            r.latitude !== null && r.longitude !== null,
        )
        .map((r) => ({
          id: r.id,
          lat: r.latitude,
          lng: r.longitude,
          color: r.id === selectedId ? '#0D47A1' : '#1565C0',
        })),
    [filtered, selectedId],
  )

  const mapCenter =
    selected?.latitude != null && selected?.longitude != null
      ? { lat: selected.latitude, lng: selected.longitude }
      : undefined

  const activeCount = initialRows.filter((r) => r.is_active).length

  return (
    <>
      <SubHeader
        title="ლოკაციები"
        subtitle={`${activeCount} აქტიური · ${initialRows.length - activeCount} გათიშული`}
        actions={
          <Link href="/locations/new">
            <Button>
              <Plus className="h-4 w-4" />
              ახალი ლოკაცია
            </Button>
          </Link>
        }
      />

      <main className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ძებნა სახელით ან მისამართით..."
              className="h-8 w-full rounded-[6px] border border-[var(--color-border)] bg-white pl-9 pr-3 text-[13px] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryFilter)}
            className="h-8 rounded-[6px] border border-[var(--color-border)] bg-white px-3 text-[13px] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
          >
            <option value="all">ყველა კატეგორია</option>
            {(Object.entries(categoryLabels) as [LocationCategory, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <LocationsList rows={filtered} selectedId={selectedId} onSelect={setSelectedId} />

          <div className="rounded-[10px] border border-[var(--color-border)] bg-white overflow-hidden">
            {selected ? (
              <>
                <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    დეტალები
                  </p>
                  <h3 className="text-[14px] font-bold text-[var(--color-text-primary)]">
                    {selected.name}
                  </h3>
                </div>
                <MapboxMap
                  className="h-[280px] w-full"
                  center={mapCenter}
                  zoom={14}
                  markers={markers}
                />
                <dl className="grid grid-cols-2 gap-3 px-5 py-4 text-[12px]">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      კატეგორია
                    </dt>
                    <dd className="mt-0.5 text-[var(--color-text-primary)]">
                      {categoryLabels[selected.category ?? 'other']}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      რადიუსი
                    </dt>
                    <dd className="mt-0.5 text-[var(--color-text-primary)]">
                      {selected.radius_m} მ
                    </dd>
                  </div>
                  {selected.address && (
                    <div className="col-span-2">
                      <dt className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        მისამართი
                      </dt>
                      <dd className="mt-0.5 text-[var(--color-text-primary)]">
                        {selected.address}
                      </dd>
                    </div>
                  )}
                </dl>
              </>
            ) : (
              <MapboxMap className="h-[420px] w-full" markers={markers} />
            )}
          </div>
        </div>
      </main>
    </>
  )
}
