'use client'

import { useState } from 'react'
import { createLocation } from '@/app/(app)/locations/new/create-action'
import { MapboxMap } from '@/components/map/MapboxMap'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { type LocationCategory, categoryLabels } from './types'

interface LocationCreateFormProps {
  tenantId: string
}

const TBILISI = { lat: 41.7167, lng: 44.7833 }

export function LocationCreateForm({ tenantId }: LocationCreateFormProps) {
  const [position, setPosition] = useState(TBILISI)
  const [radius, setRadius] = useState(100)
  const [category, setCategory] = useState<LocationCategory>('office')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.set('tenantId', tenantId)
    formData.set('latitude', String(position.lat))
    formData.set('longitude', String(position.lng))
    formData.set('radiusM', String(radius))
    formData.set('category', category)
    const result = await createLocation(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-white">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
          <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">რუკაზე მონიშნე</h2>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            დააჭირე რუკას სასურველ წერტილზე ან გადათარე pin-ი
          </p>
        </div>
        <MapboxMap
          className="h-[480px] w-full"
          center={position}
          zoom={14}
          draggablePin={position}
          onPinDrag={(lat, lng) => setPosition({ lat, lng })}
          radiusM={radius}
        />
        <div className="grid grid-cols-2 gap-3 border-t border-[var(--color-border)] px-5 py-3 text-[11px] tabular-nums">
          <div>
            <p className="uppercase tracking-wider text-[var(--color-text-tertiary)]">Latitude</p>
            <p className="text-[var(--color-text-primary)]">{position.lat.toFixed(6)}</p>
          </div>
          <div>
            <p className="uppercase tracking-wider text-[var(--color-text-tertiary)]">Longitude</p>
            <p className="text-[var(--color-text-primary)]">{position.lng.toFixed(6)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-[10px] border border-[var(--color-border)] bg-white p-5">
        <Input id="name" name="name" label="სახელი" required placeholder="მაგ. ცენტრალური ოფისი" />

        <div className="space-y-1">
          <label
            htmlFor="category"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]"
          >
            კატეგორია
          </label>
          <select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as LocationCategory)}
            className="h-8 w-full rounded-[6px] border border-[var(--color-border)] bg-white px-3 text-[13px] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
          >
            {(Object.entries(categoryLabels) as [LocationCategory, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>

        <Input
          id="address"
          name="address"
          label="მისამართი (სურვილისამებრ)"
          placeholder="ვაჟა-ფშაველას 76"
        />

        <div className="space-y-1">
          <label className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            <span>რადიუსი</span>
            <span className="text-[var(--color-text-primary)] tabular-nums">{radius} მ</span>
          </label>
          <input
            type="range"
            min={50}
            max={1500}
            step={10}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
          <p className="text-[10px] text-[var(--color-text-tertiary)]">
            50მ — 1500მ. სტანდარტი 100მ.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-[12px] text-[var(--color-error-text)]">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => history.back()}>
            გაუქმება
          </Button>
          <Button type="submit" loading={loading}>
            შენახვა
          </Button>
        </div>
      </div>
    </form>
  )
}
