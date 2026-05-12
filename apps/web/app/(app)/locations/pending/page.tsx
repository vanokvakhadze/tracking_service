import { redirect } from 'next/navigation'
import { SubHeader } from '@/components/layout/SubHeader'
import { ProvisionalCard, type ProvisionalSubmission } from '@/components/locations/ProvisionalCard'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import type { LocationCategory } from '@/components/locations/types'

interface PendingLocationRow {
  id: string
  name: string | null
  category: LocationCategory | null
  photo_url: string | null
  latitude: number | null
  longitude: number | null
  submitted_at: string | null
  created_at: string | null
  created_by:
    | { first_name: string | null; last_name: string | null; email: string | null }
    | { first_name: string | null; last_name: string | null; email: string | null }[]
    | null
}

interface ActiveLocationRow {
  latitude: number | null
  longitude: number | null
}

export const dynamic = 'force-dynamic'

export default async function PendingLocationsPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const membership = me.memberships?.find((m) => m.is_active)
  const tenantId = membership?.tenant?.id
  const isAdmin = membership && ['tenant_admin', 'super_admin'].includes(membership.role)

  if (!tenantId) {
    return (
      <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
        აქტიური workspace ვერ მოიძებნა.
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <>
        <SubHeader title="მოლოდინში — ლოკაციები" />
        <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
          pending ლოკაციების განხილვა მხოლოდ admin-ს შეუძლია.
        </main>
      </>
    )
  }

  const supabase = await createClient()
  const [{ data: pendingRows }, { data: activeRows }] = await Promise.all([
    supabase
      .from('locations')
      .select(
        'id, name, category, photo_url, latitude, longitude, submitted_at, created_at, created_by:users!locations_created_by_user_id_fkey(first_name, last_name, email)',
      )
      .eq('tenant_id', tenantId)
      .eq('status', 'pending_approval')
      .is('deleted_at', null)
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .overrideTypes<PendingLocationRow[], { merge: false }>(),
    supabase
      .from('locations')
      .select('latitude, longitude')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .overrideTypes<ActiveLocationRow[], { merge: false }>(),
  ])

  const activeLocations = (activeRows ?? []).filter(hasCoordinates)
  const submissions = await Promise.all(
    (pendingRows ?? [])
      .filter(hasCoordinates)
      .map((row) => toSubmission(row, activeLocations, supabase)),
  )

  return (
    <>
      <SubHeader title="მოლოდინში — ლოკაციები" subtitle={`${submissions.length} ახალი მოთხოვნა`} />
      <main className="p-6">
        {submissions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {submissions.map((submission) => (
              <ProvisionalCard key={submission.id} submission={submission} />
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] border border-[var(--color-border)] bg-white p-12 text-center">
            <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
              pending ლოკაციები არ არის
            </p>
            <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
              ახალი employee submission-ები აქ გამოჩნდება დასამტკიცებლად.
            </p>
          </div>
        )}
      </main>
    </>
  )
}

async function toSubmission(
  row: PendingLocationRow & { latitude: number; longitude: number },
  activeLocations: (ActiveLocationRow & { latitude: number; longitude: number })[],
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<ProvisionalSubmission> {
  const employee = normalizeEmployee(row.created_by)
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    photoUrl: await getSignedPhotoUrl(supabase, row.photo_url),
    employeeName: employee.name,
    employeeInitials: employee.initials,
    latitude: row.latitude,
    longitude: row.longitude,
    submittedAt: row.submitted_at ?? row.created_at,
    distanceToNearestM: nearestDistance(row, activeLocations),
  }
}

function hasCoordinates<T extends { latitude: number | null; longitude: number | null }>(
  row: T,
): row is T & { latitude: number; longitude: number } {
  return row.latitude !== null && row.longitude !== null
}

async function getSignedPhotoUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  photoUrl: string | null,
) {
  if (!photoUrl) return null
  if (photoUrl.startsWith('http')) return photoUrl
  const { data } = await supabase.storage.from('provisional-photos').createSignedUrl(photoUrl, 600)
  return data?.signedUrl ?? null
}

function normalizeEmployee(row: PendingLocationRow['created_by']) {
  const user = Array.isArray(row) ? row[0] : row
  const name =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'Employee'
  const initials = name
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('')
  return { name, initials: initials || 'E' }
}

function nearestDistance(
  row: { latitude: number; longitude: number },
  activeLocations: { latitude: number; longitude: number }[],
) {
  if (activeLocations.length === 0) return null
  return Math.min(
    ...activeLocations.map((location) =>
      distanceMeters(row.latitude, row.longitude, location.latitude, location.longitude),
    ),
  )
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
