import { redirect } from 'next/navigation'
import { SubHeader } from '@/components/layout/SubHeader'
import { CompanyProfileForm } from '@/components/settings/CompanyProfileForm'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')

  const myActive = me.memberships?.find((m) => m.is_active)
  if (!myActive || !['tenant_admin', 'super_admin'].includes(myActive.role)) {
    return (
      <>
        <SubHeader title="პარამეტრები" />
        <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
          ამ გვერდზე წვდომა მხოლოდ admin-ს აქვს.
        </main>
      </>
    )
  }

  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, subdomain, timezone, default_language, default_geofence_radius_m')
    .eq('id', myActive.tenant?.id ?? '')
    .single()

  if (!tenant) {
    return (
      <>
        <SubHeader title="პარამეტრები" />
        <main className="p-8 text-[13px] text-[var(--color-text-secondary)]">
          კომპანიის ინფორმაცია ვერ ჩაიტვირთა.
        </main>
      </>
    )
  }

  return (
    <>
      <SubHeader title="პარამეტრები" subtitle="კომპანიის პროფილი + ნაგულისხმევი ნაკრები" />

      <main className="p-6">
        <div className="max-w-2xl rounded-lg border border-[var(--color-border)] bg-white">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
            <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              კომპანიის პროფილი
            </h2>
          </div>
          <div className="px-6 py-5">
            <CompanyProfileForm
              tenantId={tenant.id}
              name={tenant.name}
              subdomain={tenant.subdomain}
              timezone={tenant.timezone ?? 'Asia/Tbilisi'}
              defaultLanguage={tenant.default_language ?? 'ka'}
              defaultGeofenceRadiusM={tenant.default_geofence_radius_m ?? 100}
            />
          </div>
        </div>

        <div className="mt-6 max-w-2xl rounded-lg border border-[var(--color-border)] bg-white">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
            <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              შეტყობინებები
            </h2>
          </div>
          <div className="px-6 py-5 text-[13px] text-[var(--color-text-secondary)]">
            Push და email შეტყობინებების მართვა — Phase 4-ში.
          </div>
        </div>

        <div className="mt-6 max-w-2xl rounded-lg border border-[var(--color-border)] bg-white">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
            <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              გადახდები
            </h2>
          </div>
          <div className="px-6 py-5 text-[13px] text-[var(--color-text-secondary)]">
            Stripe ინტეგრაცია + სუბსკრიფცია — Phase 5-ში.
          </div>
        </div>
      </main>
    </>
  )
}
