import { redirect } from 'next/navigation'
import { SubHeader } from '@/components/layout/SubHeader'
import {
  AlertSettingsForm,
  type AlertKind,
  type AlertSettingRow,
} from '@/components/settings/AlertSettingsForm'
import { CompanyProfileForm } from '@/components/settings/CompanyProfileForm'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

interface AlertSettingDbRow {
  alert_kind: string
  push_enabled: boolean
  email_enabled: boolean
  email_recipients: string[]
}

const DEFAULT_ALERT_KINDS: AlertKind[] = [
  'mock_gps',
  'location_disabled',
  'low_battery',
  'out_of_zone',
]

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
  const tenantId = myActive.tenant?.id ?? ''

  const [{ data: tenant }, { data: alertSettingsRows }] = await Promise.all([
    supabase
      .from('tenants')
      .select('id, name, subdomain, timezone, default_language, default_geofence_radius_m')
      .eq('id', tenantId)
      .single(),
    // Table added in migration 20260521000001. Drop the cast after the
    // migration is applied and `pnpm db:types` is re-run.
    // biome-ignore lint/suspicious/noExplicitAny: see comment above
    (supabase as any)
      .from('tenant_alert_settings')
      .select('alert_kind, push_enabled, email_enabled, email_recipients')
      .eq('tenant_id', tenantId) as Promise<{ data: AlertSettingDbRow[] | null }>,
  ])

  const alertSettingsByKind = new Map(
    (alertSettingsRows ?? []).map((row) => [row.alert_kind, row]),
  )
  const initialAlertSettings: AlertSettingRow[] = DEFAULT_ALERT_KINDS.map((kind) => {
    const row = alertSettingsByKind.get(kind)
    return {
      alertKind: kind,
      pushEnabled: row?.push_enabled ?? true,
      emailEnabled: row?.email_enabled ?? false,
      emailRecipients: row?.email_recipients ?? [],
    }
  })

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
            <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
              თითო ალერტი ცალკე — Push (mobile admin app) + Email
            </p>
          </div>
          <div className="px-6 py-5">
            <AlertSettingsForm tenantId={tenant.id} initial={initialAlertSettings} />
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
