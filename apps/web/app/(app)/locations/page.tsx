import { redirect } from 'next/navigation'
import { LocationsPageClient } from '@/components/locations/LocationsPageClient'
import type { LocationRow } from '@/components/locations/types'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function LocationsPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const myActive = me.memberships?.find((m) => m.is_active)
  const tenantId = myActive?.tenant?.id
  if (!tenantId) {
    return (
      <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
        აქტიური workspace ვერ მოიძებნა.
      </main>
    )
  }

  const supabase = await createClient()
  // The `latitude` + `longitude` generated columns are added in migration 07.
  // Until that migration is applied + db:types is re-run, supabase-js types
  // don't know they exist — fall back to a typed view via `.returns<>()`.
  const { data: rows } = await supabase
    .from('locations')
    .select('id, name, category, address, latitude, longitude, radius_m, is_active, status, created_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .overrideTypes<LocationRow[], { merge: false }>()

  return <LocationsPageClient initialRows={rows ?? []} />
}
