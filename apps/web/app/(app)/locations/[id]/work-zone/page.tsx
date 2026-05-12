import { notFound, redirect } from 'next/navigation'
import { SubHeader } from '@/components/layout/SubHeader'
import { WorkZoneConfig, type WorkZoneLocation } from '@/components/locations/WorkZoneConfig'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

interface WorkZonePageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function WorkZonePage({ params }: WorkZonePageProps) {
  const { id } = await params
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
        <SubHeader title="სამუშაო ზონის კონფიგურაცია" />
        <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
          სამუშაო ზონის შეცვლა მხოლოდ admin-ს შეუძლია.
        </main>
      </>
    )
  }

  const supabase = await createClient()
  const { data: location } = await supabase
    .from('locations')
    .select(
      'id, name, address, latitude, longitude, trigger_radius_m, boundary_radius_m',
    )
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .maybeSingle()
    .overrideTypes<WorkZoneLocation, { merge: false }>()

  if (!location) notFound()

  return (
    <>
      <SubHeader
        title="სამუშაო ზონის კონფიგურაცია"
        subtitle={`${location.name}${location.address ? ` · ${location.address}` : ''}`}
      />
      <WorkZoneConfig location={location} />
    </>
  )
}
