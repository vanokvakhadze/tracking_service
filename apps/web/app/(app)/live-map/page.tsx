import { SubHeader } from '@/components/layout/SubHeader'
import { LiveMapFullscreen } from '@/components/dashboard/LiveMapFullscreen'
import type { LiveShift } from '@/components/dashboard/LiveShiftsCard'
import type { LocationRow } from '@/components/locations/types'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

export default async function LiveMapPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const membership = me.memberships?.find((m) => m.is_active)
  const tenant = membership?.tenant

  let locations: LocationRow[] = []
  let initialShifts: LiveShift[] = []

  if (tenant?.id) {
    const supabase = await createClient()
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
        const user = Array.isArray(row.user) ? row.user[0] : row.user
        const userName =
          [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || '—'
        return {
          id: row.id,
          user_id: row.user_id,
          user_name: userName,
          started_at: row.started_at,
          location_name: null,
        }
      }) ?? []
  }

  return (
    <>
      <SubHeader
        title="ცოცხალი რუკა"
        subtitle={`${locations.filter((l) => l.is_active).length} ლოკაცია · ${initialShifts.length} აქტიური ცვლა`}
        liveLabel="ცოცხალია"
      />
      <LiveMapFullscreen
        tenantId={tenant?.id ?? ''}
        locations={locations}
        initialShifts={initialShifts}
      />
    </>
  )
}
