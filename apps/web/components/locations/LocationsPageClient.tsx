'use client'

import { SubHeader } from '@/components/layout/SubHeader'
import { MapboxMap, type MarkerSpec } from '@/components/map/MapboxMap'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Download, MapPin, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { CategoryChips, type CategoryFilter } from './CategoryChips'
import { LocationHeroCard } from './LocationHeroCard'
import { LocationStatStrip } from './LocationStatStrip'
import { LocationsList } from './LocationsList'
import { type LocationsView, LocationsViewToggle } from './LocationsViewToggle'
import { TopLocationsRail } from './TopLocationsRail'
import type { LocationRow, LocationStats, TopLocationRow } from './types'
import { categoryLabels } from './types'

interface LocationsPageClientProps {
  initialRows: LocationRow[]
  stats: LocationStats
  topLocations: TopLocationRow[]
}

function isLocationsView(value: string | null): value is LocationsView {
  return value === 'grid' || value === 'list' || value === 'map'
}

function csvValue(value: string | number | null | undefined) {
  const normalized = value == null ? '' : String(value)
  return `"${normalized.replaceAll('"', '""')}"`
}

export function LocationsPageClient({
  initialRows,
  stats,
  topLocations,
}: LocationsPageClientProps) {
  const searchParams = useSearchParams()
  const viewParam = searchParams.get('view')
  const view: LocationsView = isLocationsView(viewParam) ? viewParam : 'grid'

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(initialRows[0]?.id ?? null)

  const categoryCounts = useMemo(
    () =>
      initialRows.reduce<Record<CategoryFilter, number>>(
        (acc, row) => {
          acc.all += 1
          acc[row.category ?? 'other'] += 1
          return acc
        },
        { all: 0, office: 0, client_site: 0, warehouse: 0, checkpoint: 0, other: 0 },
      ),
    [initialRows],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return initialRows.filter((row) => {
      if (category !== 'all' && row.category !== category) return false
      if (!q) return true
      const haystack = [row.name, row.address, categoryLabels[row.category ?? 'other']]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [initialRows, search, category])

  const selected = useMemo(
    () => filtered.find((row) => row.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId],
  )

  const markers: MarkerSpec[] = useMemo(
    () =>
      filtered
        .filter(
          (row): row is LocationRow & { latitude: number; longitude: number } =>
            row.latitude !== null && row.longitude !== null,
        )
        .map((row) => ({
          id: row.id,
          lat: row.latitude,
          lng: row.longitude,
          color: row.id === selected?.id ? 'var(--color-accent-hover)' : 'var(--color-accent)',
        })),
    [filtered, selected?.id],
  )

  const mapCenter =
    selected?.latitude != null && selected?.longitude != null
      ? { lat: selected.latitude, lng: selected.longitude }
      : undefined

  const activeCount = initialRows.filter((row) => row.is_active && row.status === 'active').length
  const inactiveCount = Math.max(0, initialRows.length - activeCount)

  function exportLocations() {
    const header = ['name', 'category', 'address', 'status', 'visits_today', 'avg_dwell_minutes']
    const lines = filtered.map((row) =>
      [
        row.name,
        categoryLabels[row.category ?? 'other'],
        row.address,
        row.status,
        row.analytics?.visitsToday ?? 0,
        row.analytics?.avgDwellMinutes ?? 0,
      ]
        .map(csvValue)
        .join(','),
    )
    const blob = new Blob([[header.join(','), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'locations.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <SubHeader
        title="ლოკაციები"
        subtitle={`${activeCount} აქტიური · ${inactiveCount} არააქტიური`}
        actions={
          <>
            <LocationsViewToggle view={view} />
            <Button variant="secondary" onClick={exportLocations}>
              <Download className="h-4 w-4" />
              ექსპორტი
            </Button>
            <Link href="/locations/new">
              <Button>
                <Plus className="h-4 w-4" />
                ახალი ლოკაცია
              </Button>
            </Link>
          </>
        }
      />

      <main className="space-y-4 p-6">
        <LocationStatStrip stats={stats} />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ძებნა სახელით, მისამართით ან კატეგორიით..."
              className="h-9 w-full rounded-[8px] border border-[var(--color-border)] bg-white pl-9 pr-3 text-[13px] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
            />
          </div>
          <CategoryChips value={category} counts={categoryCounts} onChange={setCategory} />
        </div>

        {view === 'map' ? (
          <section className="overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-white">
            <MapboxMap
              className="h-[620px] w-full"
              center={mapCenter}
              zoom={12}
              markers={markers}
            />
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.95fr]">
            {view === 'list' ? (
              <LocationsList
                rows={filtered}
                selectedId={selected?.id ?? null}
                onSelect={setSelectedId}
              />
            ) : (
              <section className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
                {filtered.length === 0 ? (
                  initialRows.length === 0 ? (
                    <div className="2xl:col-span-2">
                      <EmptyState
                        icon={<MapPin className="h-6 w-6" />}
                        title="პირველი ლოკაცია ჯერ არ შექმნილა"
                        description="ოფისი, საწყობი ან customer site — დაამატე ლოკაცია geofence radius-ით და თანამშრომელი ცვლის გახსნისთანავე აქ გამოჩნდება."
                        action={{ label: 'დაამატე ლოკაცია', href: '/locations/new' }}
                      />
                    </div>
                  ) : (
                    <div className="rounded-[8px] border border-[var(--color-border)] bg-white p-12 text-center text-[13px] text-[var(--color-text-secondary)] 2xl:col-span-2">
                      ამ ფილტრებით ლოკაცია ვერ მოიძებნა.
                    </div>
                  )
                ) : (
                  filtered.map((location) => (
                    <LocationHeroCard
                      key={location.id}
                      location={location}
                      selected={location.id === selected?.id}
                      onSelect={setSelectedId}
                    />
                  ))
                )}
              </section>
            )}

            <aside className="space-y-4">
              <div className="overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-white">
                {selected ? (
                  <>
                    <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        დეტალები
                      </p>
                      <h3 className="text-[14px] font-bold text-[var(--color-text-primary)]">
                        {selected.name ?? 'უსახელო ლოკაცია'}
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
                      <div>
                        <dt className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          საზღვარი
                        </dt>
                        <dd className="mt-0.5 text-[var(--color-text-primary)]">
                          {selected.boundary_radius_m ?? selected.radius_m} მ
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          ვიზიტები დღეს
                        </dt>
                        <dd className="mt-0.5 text-[var(--color-text-primary)]">
                          {selected.analytics?.visitsToday ?? 0}
                        </dd>
                      </div>
                      {selected.address ? (
                        <div className="col-span-2">
                          <dt className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                            მისამართი
                          </dt>
                          <dd className="mt-0.5 text-[var(--color-text-primary)]">
                            {selected.address}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </>
                ) : (
                  <MapboxMap className="h-[420px] w-full" markers={markers} />
                )}
              </div>

              <TopLocationsRail rows={topLocations} />
            </aside>
          </div>
        )}
      </main>
    </>
  )
}
