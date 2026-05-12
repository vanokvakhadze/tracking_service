'use client'

import { Check, MapPin, User, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { approveLocation } from '@/app/(app)/locations/pending/actions'
import { MapboxMap, type MarkerSpec } from '@/components/map/MapboxMap'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { type LocationCategory, categoryLabels } from './types'
import { RejectDialog } from './RejectDialog'

export interface ProvisionalSubmission {
  id: string
  name: string | null
  category: LocationCategory | null
  photoUrl: string | null
  employeeName: string
  employeeInitials: string
  latitude: number
  longitude: number
  submittedAt: string | null
  distanceToNearestM: number | null
}

interface ProvisionalCardProps {
  submission: ProvisionalSubmission
}

export function ProvisionalCard({ submission }: ProvisionalCardProps) {
  const router = useRouter()
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [finalName, setFinalName] = useState(submission.name ?? '')
  const [category, setCategory] = useState<LocationCategory>(submission.category ?? 'other')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const marker = useMemo<MarkerSpec[]>(
    () => [{ id: submission.id, lat: submission.latitude, lng: submission.longitude }],
    [submission.id, submission.latitude, submission.longitude],
  )

  async function handleApprove(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.set('locationId', submission.id)
    formData.set('category', category)

    const result = await approveLocation(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    setApproveOpen(false)
    router.refresh()
  }

  return (
    <article className="overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="h-36 bg-[var(--color-surface-2)]">
          {submission.photoUrl ? (
            <img src={submission.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[var(--color-text-tertiary)]">
              <MapPin className="h-8 w-8" />
            </div>
          )}
        </div>
        <MapboxMap
          className="h-36 w-full"
          center={{ lat: submission.latitude, lng: submission.longitude }}
          zoom={15}
          markers={marker}
        />
      </div>
      <div className="space-y-4 p-4">
        <div>
          <span className="inline-flex items-center rounded-full border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-warning-text)]">
            მოლოდინში
          </span>
          <h2 className="mt-3 text-[15px] font-bold text-[var(--color-text-primary)]">
            {submission.name ?? 'ახალი ლოკაცია'}
          </h2>
          <p className="mt-1 text-[12px] tabular-nums text-[var(--color-text-secondary)]">
            {submission.latitude.toFixed(5)}, {submission.longitude.toFixed(5)}
          </p>
          <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
            უახლოესი აქტიურიდან: {formatDistance(submission.distanceToNearestM)}
          </p>
        </div>
        <div className="flex items-center gap-3 border-t border-[var(--color-border)] pt-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent-tint)] text-[12px] font-semibold text-[var(--color-accent)]">
            {submission.employeeInitials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[var(--color-text-primary)]">
              {submission.employeeName}
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              {formatRelativeTime(submission.submittedAt)}
            </p>
          </div>
          <User className="ml-auto h-4 w-4 text-[var(--color-text-tertiary)]" />
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setApproveOpen(true)}>
            <Check className="h-4 w-4" />
            დამტკიცება
          </Button>
          <Button variant="secondary" aria-label="უარყოფა" onClick={() => setRejectOpen(true)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Dialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="ლოკაციის დამტკიცება"
        description="დაარქვი საბოლოო სახელი და აირჩიე კატეგორია."
      >
        <form action={handleApprove} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor={`approve-name-${submission.id}`}
              className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]"
            >
              სახელი
            </label>
            <input
              id={`approve-name-${submission.id}`}
              name="name"
              required
              minLength={2}
              value={finalName}
              onChange={(event) => setFinalName(event.target.value)}
              className="h-8 w-full rounded-[6px] border border-[var(--color-border)] bg-white px-3 text-[13px] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor={`approve-category-${submission.id}`}
              className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]"
            >
              კატეგორია
            </label>
            <select
              id={`approve-category-${submission.id}`}
              value={category}
              onChange={(event) => setCategory(event.target.value as LocationCategory)}
              className="h-8 w-full rounded-[6px] border border-[var(--color-border)] bg-white px-3 text-[13px] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
            >
              {(Object.entries(categoryLabels) as [LocationCategory, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <div className="rounded-md border border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3 text-[12px] text-[var(--color-error-text)]">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setApproveOpen(false)}>
              გაუქმება
            </Button>
            <Button type="submit" loading={loading}>
              დამტკიცება
            </Button>
          </div>
        </form>
      </Dialog>

      <RejectDialog open={rejectOpen} locationId={submission.id} onClose={() => setRejectOpen(false)} />
    </article>
  )
}

function formatDistance(distanceM: number | null) {
  if (distanceM === null) return 'აქტიური ლოკაცია არ არის'
  if (distanceM < 1000) return `${Math.round(distanceM)} მ`
  return `${(distanceM / 1000).toFixed(1)} კმ`
}

function formatRelativeTime(value: string | null) {
  if (!value) return 'დრო უცნობია'
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (diffMinutes < 60) return `${diffMinutes} წუთის წინ`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} საათის წინ`
  return `${Math.round(diffHours / 24)} დღის წინ`
}
