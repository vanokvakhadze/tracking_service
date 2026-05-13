import { Activity, MapPin, Route, Users } from 'lucide-react'
import { LiveShiftsCard, type LiveShift } from '@/components/dashboard/LiveShiftsCard'
import { DashboardLiveMap } from '@/components/dashboard/DashboardLiveMap'
import { SubHeader } from '@/components/layout/SubHeader'
import type { LocationRow } from '@/components/locations/types'
import { MetricCard } from '@/components/reports/MetricCard'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface ShiftUser {
  first_name: string | null
  last_name: string | null
  email: string | null
}

interface ShiftRow {
  id: string
  user_id: string
  started_at: string
  user: ShiftUser | ShiftUser[] | null
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const tenant = user?.memberships?.find((m) => m.is_active)?.tenant

  const supabase = await createClient()
  let locations: LocationRow[] = []
  let initialShifts: LiveShift[] = []

  if (tenant?.id) {
    const [{ data: locationRows }, { data: shiftRows }] = await Promise.all([
      supabase
        .from('locations')
        .select('id, name, category, address, latitude, longitude, radius_m, is_active, created_at')
        .eq('tenant_id', tenant.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .overrideTypes<LocationRow[], { merge: false }>(),
      supabase
        .from('shifts')
        .select('id, user_id, started_at, user:users(first_name, last_name, email)')
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false }),
    ])

    locations = locationRows ?? []
    initialShifts =
      (shiftRows as ShiftRow[] | null | undefined)?.map((row) => {
        const userRow = Array.isArray(row.user) ? row.user[0] : row.user
        const userName =
          [userRow?.first_name, userRow?.last_name].filter(Boolean).join(' ') ||
          userRow?.email ||
          '—'

        return {
          id: row.id,
          user_id: row.user_id,
          user_name: userName,
          started_at: row.started_at,
          location_name: null,
        }
      }) ?? []
  }

  const activeLocations = locations.filter((location) => location.is_active).length

  const now = new Date()
  const formatter = new Intl.DateTimeFormat('ka-GE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const subtitle = `${formatter.format(now)} · განახლება ცოცხლად`

  return (
    <>
      <SubHeader title="ცოცხალი დაშბორდი" subtitle={subtitle} liveLabel="ცოცხალია" />

      <main className="p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="აქტიური ცვლები" value="0 / 0" icon={Activity} tone="accent" />
          <MetricCard label="დღევანდელი მანძილი" value="0 კმ" icon={Route} tone="success" />
          <MetricCard
            label="ლოკაციები"
            value={String(activeLocations)}
            delta={`${locations.length} ჯამში`}
            icon={MapPin}
            tone="accent"
          />
          <MetricCard label="აქტიური ალერტი" value="0" icon={Users} tone="warning" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
          <div className="overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
              <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">
                ცოცხალი რუკა
              </h2>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {activeLocations} ლოკაცია · 0 ცვლა
              </p>
            </div>
            <DashboardLiveMap locations={locations} />
          </div>

          <div className="overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
              <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">
                აქტიური მომხმარებლები
              </h2>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">0 / 0</p>
            </div>
            <LiveShiftsCard tenantId={tenant?.id ?? ''} initialShifts={initialShifts} />
          </div>
        </div>
      </main>
    </>
  )
}
