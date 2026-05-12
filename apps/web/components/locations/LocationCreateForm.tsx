'use client'

import { clsx } from 'clsx'
import { Map as MapIcon, Search } from 'lucide-react'
import { useState } from 'react'
import { createLocation } from '@/app/(app)/locations/new/create-action'
import { MapboxMap } from '@/components/map/MapboxMap'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AddressSearchBox } from './AddressSearchBox'
import { type LocationCategory, categoryLabels } from './types'

interface LocationCreateFormProps {
  tenantId: string
}

const TBILISI = { lat: 41.7167, lng: 44.7833 }

type Mode = 'map' | 'address'

export function LocationCreateForm({ tenantId }: LocationCreateFormProps) {
  const [mode, setMode] = useState<Mode>('map')
  const [position, setPosition] = useState(TBILISI)
  const [triggerRadius, setTriggerRadius] = useState(100)
  const [boundaryRadius, setBoundaryRadius] = useState(200)
  const [category, setCategory] = useState<LocationCategory>('office')
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    if (triggerRadius > boundaryRadius) {
      setError('Trigger რადიუსი Boundary რადიუსზე მეტი ვერ იქნება.')
      setLoading(false)
      return
    }
    formData.set('tenantId', tenantId)
    formData.set('latitude', String(position.lat))
    formData.set('longitude', String(position.lng))
    formData.set('triggerRadiusM', String(triggerRadius))
    formData.set('boundaryRadiusM', String(boundaryRadius))
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
          <div className="inline-flex rounded-[8px] bg-[var(--color-surface-2)] p-1">
            <ModeTab
              active={mode === 'map'}
              onClick={() => setMode('map')}
              icon={<MapIcon className="h-3.5 w-3.5" />}
              label="რუკაზე"
            />
            <ModeTab
              active={mode === 'address'}
              onClick={() => setMode('address')}
              icon={<Search className="h-3.5 w-3.5" />}
              label="მისამართით"
            />
          </div>
          <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
            {mode === 'map'
              ? 'დააჭირე რუკას სასურველ წერტილზე ან გადათარე pin-ი'
              : 'შეიყვანე მისამართი — შერჩევაზე pin გადახტება'}
          </p>
        </div>

        {mode === 'address' && (
          <div className="border-b border-[var(--color-border)] px-5 py-3">
            <AddressSearchBox
              proximity={position}
              onSelect={({ lat, lng, placeName }) => {
                setPosition({ lat, lng })
                setAddress(placeName)
              }}
            />
          </div>
        )}

        <MapboxMap
          className="h-[440px] w-full"
          center={position}
          zoom={14}
          draggablePin={position}
          onPinDrag={(lat, lng) => setPosition({ lat, lng })}
          radiusM={{ trigger: triggerRadius, boundary: boundaryRadius }}
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
          label="მისამართი"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="ვაჟა-ფშაველას 76"
        />

        <div className="space-y-1">
          <label className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            <span>ცვლის ცენტრი (Trigger)</span>
            <span className="text-[var(--color-accent)] tabular-nums">{triggerRadius} მ</span>
          </label>
          <input
            type="range"
            min={50}
            max={1500}
            step={10}
            value={triggerRadius}
            onChange={(e) => setTriggerRadius(Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
          <p className="text-[10px] text-[var(--color-text-tertiary)]">
            Shift auto start/end ზონა. 50მ — 1500მ.
          </p>
        </div>

        <div className="space-y-1">
          <label className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            <span>სამუშაო ზონა (Boundary)</span>
            <span className="text-[var(--color-warning-text)] tabular-nums">
              {boundaryRadius} მ
            </span>
          </label>
          <input
            type="range"
            min={100}
            max={5000}
            step={10}
            value={boundaryRadius}
            onChange={(e) => setBoundaryRadius(Number(e.target.value))}
            className="w-full accent-[var(--color-warning)]"
          />
          <p className="text-[10px] text-[var(--color-text-tertiary)]">
            Alert ზონა სამუშაო ტერიტორიისთვის. 100მ — 5000მ.
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

interface ModeTabProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function ModeTab({ active, onClick, icon, label }: ModeTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1 text-[12px] font-semibold transition-colors',
        active
          ? 'bg-white text-[var(--color-text-primary)] shadow-sm'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
