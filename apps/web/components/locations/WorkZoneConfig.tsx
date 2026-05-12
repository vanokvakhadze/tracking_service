'use client'

import { Save, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { updateWorkZone } from '@/app/(app)/locations/[id]/work-zone/update-action'
import { MapboxMap } from '@/components/map/MapboxMap'
import { Button } from '@/components/ui/Button'

export interface WorkZoneLocation {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  trigger_radius_m: number
  boundary_radius_m: number
}

interface WorkZoneConfigProps {
  location: WorkZoneLocation
}

export function WorkZoneConfig({ location }: WorkZoneConfigProps) {
  const [triggerRadius, setTriggerRadius] = useState(location.trigger_radius_m)
  const [boundaryRadius, setBoundaryRadius] = useState(location.boundary_radius_m)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const center = { lat: location.latitude, lng: location.longitude }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setSaved(false)
    setError(null)
    if (triggerRadius > boundaryRadius) {
      setError('Trigger რადიუსი Boundary რადიუსზე მეტი ვერ იქნება.')
      setLoading(false)
      return
    }

    formData.set('locationId', location.id)
    formData.set('triggerRadiusM', String(triggerRadius))
    formData.set('boundaryRadiusM', String(boundaryRadius))

    const result = await updateWorkZone(formData)
    if (result?.error) setError(result.error)
    else setSaved(true)
    setLoading(false)
  }

  return (
    <form
      action={handleSubmit}
      className="grid min-h-[calc(100vh-110px)] grid-cols-1 lg:grid-cols-[420px_1fr]"
    >
      <section className="space-y-5 border-r border-[var(--color-border)] bg-white p-6">
        <div className="rounded-[8px] border border-[var(--color-accent)]/25 bg-[var(--color-accent-tint)] p-4">
          <p className="text-[13px] leading-6 text-[var(--color-accent-hover)]">
            გეოღობე = სამუშაო ზონის უსაფრთხო საზღვარი. Trigger ცვლის დაწყება/დასრულებას აკონტროლებს,
            Boundary კი ფართო სამუშაო ზონის alert-ს.
          </p>
        </div>
        <RadiusControl
          label="ცვლის ცენტრი (Trigger)"
          value={triggerRadius}
          min={50}
          max={1500}
          tone="accent"
          onChange={setTriggerRadius}
          description="Employee ამ წრეში შესვლისას ცვლა ავტომატურად იწყება. გასვლისას ცვლა მთავრდება."
        />
        <div className="rounded-[8px] border border-[var(--color-accent)] bg-[var(--color-accent-tint)] p-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-accent-hover)]">
            <ShieldCheck className="h-4 w-4" />
            ცვლა იწყება შესვლისას
          </div>
          <p className="mt-1 text-[11px] text-[var(--color-accent-hover)]">
            ENTRY {'->'} SHIFT_START
          </p>
        </div>
        <div className="rounded-[8px] border border-[var(--color-accent)] bg-[var(--color-accent-tint)] p-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-accent-hover)]">
            <ShieldCheck className="h-4 w-4" />
            ცვლა მთავრდება გასვლისას
          </div>
          <p className="mt-1 text-[11px] text-[var(--color-accent-hover)]">EXIT {'->'} SHIFT_END</p>
        </div>
        <div className="border-t border-[var(--color-border)] pt-5">
          <RadiusControl
            label="სამუშაო ზონა (Boundary)"
            value={boundaryRadius}
            min={100}
            max={5000}
            tone="warning"
            onChange={setBoundaryRadius}
            description="ფართო ზონა, სადაც employee-ის შემოსვლა/გასვლა მხოლოდ admin alert-ად ინახება."
          />
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[var(--color-border)] pt-5">
          <ReadOnlyRule label="შესვლა" value="30 წამი" />
          <ReadOnlyRule label="გასვლა" value="60 წამი" />
        </div>

        {error && (
          <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-[12px] text-[var(--color-error-text)]">
            {error}
          </div>
        )}
        {saved && (
          <div className="rounded-md border border-[var(--color-success-border)] bg-[var(--color-success-bg)] p-3 text-[12px] text-[var(--color-success-text)]">
            სამუშაო ზონა შენახულია.
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-5">
          <Button type="button" variant="secondary" onClick={() => history.back()}>
            უკან
          </Button>
          <Button type="submit" loading={loading}>
            <Save className="h-4 w-4" />
            შენახვა
          </Button>
        </div>
      </section>

      <section className="relative min-h-[520px] overflow-hidden bg-[var(--color-surface)]">
        <div className="absolute left-8 top-8 z-10 rounded-[8px] border border-[var(--color-border)] bg-white/95 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            ლეგენდა
          </p>
          <LegendRow colorClass="bg-[var(--color-accent)]" label="ცვლის ცენტრი — auto start/end" />
          <LegendRow colorClass="bg-[var(--color-warning)]" label="სამუშაო ზონა — alert" />
        </div>
        <MapboxMap
          className="h-full min-h-[520px] w-full"
          center={center}
          zoom={15}
          draggablePin={center}
          radiusM={{ trigger: triggerRadius, boundary: boundaryRadius }}
        />
      </section>
    </form>
  )
}

interface RadiusControlProps {
  label: string
  value: number
  min: number
  max: number
  tone: 'accent' | 'warning'
  description: string
  onChange: (value: number) => void
}

function RadiusControl({
  label,
  value,
  min,
  max,
  tone,
  description,
  onChange,
}: RadiusControlProps) {
  const colorClass =
    tone === 'accent' ? 'text-[var(--color-accent)]' : 'text-[var(--color-warning-text)]'
  const accentClass =
    tone === 'accent' ? 'accent-[var(--color-accent)]' : 'accent-[var(--color-warning)]'

  return (
    <div className="space-y-2">
      <label className="flex items-center justify-between text-[13px] font-bold text-[var(--color-text-primary)]">
        <span>{label}</span>
        <span className={`${colorClass} tabular-nums`}>{value} მ</span>
      </label>
      <p className="text-[12px] leading-5 text-[var(--color-text-secondary)]">{description}</p>
      <input
        type="range"
        min={min}
        max={max}
        step={10}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`w-full ${accentClass}`}
      />
      <div className="flex justify-between text-[11px] tabular-nums text-[var(--color-text-tertiary)]">
        <span>{min}მ</span>
        <span>{max}მ</span>
      </div>
    </div>
  )
}

function ReadOnlyRule({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </p>
      <p className="mt-1 text-[14px] font-semibold text-[var(--color-text-primary)]">{value}</p>
    </div>
  )
}

function LegendRow({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-[var(--color-text-primary)]">
      <span className={`h-3 w-3 rounded-full ${colorClass}`} />
      {label}
    </div>
  )
}
