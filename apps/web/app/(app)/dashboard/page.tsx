import { SubHeader } from '@/components/layout/SubHeader'
import { getCurrentUser } from '@/lib/auth/actions'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const activeMembership = user?.memberships?.find((m) => m.is_active)
  const tenant = activeMembership?.tenant
  const firstName = user?.first_name ?? ''

  return (
    <>
      <SubHeader
        title={`გამარჯობა, ${firstName}`}
        subtitle={tenant ? `${tenant.name} · trial ვერსია` : undefined}
      />
      <div className="p-6 text-[13px] text-[var(--color-text-secondary)]">
        Phase 2-ში დაშბორდი დაემატება (metrics, live map, active users). ჯერ ცარიელია.
      </div>
    </>
  )
}
