import { redirect } from 'next/navigation'
import { SubHeader } from '@/components/layout/SubHeader'
import { LocationCreateForm } from '@/components/locations/LocationCreateForm'
import { getCurrentUser } from '@/lib/auth/actions'

export default async function NewLocationPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const myActive = me.memberships?.find((m) => m.is_active)
  if (!myActive || !['tenant_admin', 'super_admin'].includes(myActive.role)) {
    return (
      <>
        <SubHeader title="ახალი ლოკაცია" />
        <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
          ლოკაციის შექმნა მხოლოდ admin-ს შეუძლია.
        </main>
      </>
    )
  }

  const tenantId = myActive.tenant?.id
  if (!tenantId) {
    return (
      <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
        აქტიური workspace ვერ მოიძებნა.
      </main>
    )
  }

  return (
    <>
      <SubHeader title="ახალი ლოკაცია" subtitle="დააჭირე რუკას → შეავსე ფორმა → შენახე" />
      <main className="p-6">
        <LocationCreateForm tenantId={tenantId} />
      </main>
    </>
  )
}
