import { SubHeader } from '@/components/layout/SubHeader'
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const myActive = me.memberships?.find((membership) => membership.is_active)
  const tenantId = myActive?.tenant?.id
  if (!tenantId) redirect('/login')

  const supabase = await createClient()
  const [membersResult, invitationsResult, locationsResult, shiftsResult] = await Promise.all([
    supabase
      .from('tenant_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
    supabase
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('accepted_at', null),
    supabase
      .from('locations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null),
    supabase
      .from('shifts')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .limit(1),
  ])

  const memberCount = membersResult.count ?? 0
  const pendingInviteCount = invitationsResult.count ?? 0
  const locationCount = locationsResult.count ?? 0
  const shiftCount = shiftsResult.count ?? 0

  const inviteStepDone = memberCount > 1 || pendingInviteCount > 0
  const locationStepDone = locationCount > 0
  const shiftStepDone = shiftCount > 0

  const tenantName = myActive?.tenant?.name ?? 'შენი workspace'

  return (
    <>
      <SubHeader
        subtitle={`${tenantName} · დააყენე ბაზისური ნაბიჯები ბეტა-სტარტამდე`}
        title="დაიწყე"
      />
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <OnboardingChecklist
          inviteStepDone={inviteStepDone}
          locationStepDone={locationStepDone}
          memberCount={memberCount}
          pendingInviteCount={pendingInviteCount}
          locationCount={locationCount}
          shiftStepDone={shiftStepDone}
        />
      </main>
    </>
  )
}
