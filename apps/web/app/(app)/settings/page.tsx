import { ArrowRight, Bell, Building2, CreditCard, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SubHeader } from '@/components/layout/SubHeader'
import {
  AlertSettingsForm,
  type AlertKind,
  type AlertSettingRow,
} from '@/components/settings/AlertSettingsForm'
import { MobileAppCard } from '@/components/onboarding/MobileAppCard'
import { CompanyProfileForm } from '@/components/settings/CompanyProfileForm'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

interface AlertSettingDbRow {
  alert_kind: string
  push_enabled: boolean
  email_enabled: boolean
  email_recipients: string[]
}

interface DeviceRow {
  id: string
  platform: string
  app_version: string | null
  last_seen_at: string
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

  const [{ data: tenant }, { data: alertSettingsRows }, { data: deviceRows }] = await Promise.all([
    supabase
      .from('tenants')
      .select(
        'id, name, subdomain, timezone, default_language, default_geofence_radius_m, subscription_status, plan_code',
      )
      .eq('id', tenantId)
      .single(),
    // Table added in migration 20260521000001. Drop the cast after the
    // migration is applied and `pnpm db:types` is re-run.
    // biome-ignore lint/suspicious/noExplicitAny: see comment above
    (supabase as any)
      .from('tenant_alert_settings')
      .select('alert_kind, push_enabled, email_enabled, email_recipients')
      .eq('tenant_id', tenantId) as Promise<{ data: AlertSettingDbRow[] | null }>,
    supabase
      .from('user_devices')
      .select('id, platform, app_version, last_seen_at')
      .eq('user_id', me.id)
      .order('last_seen_at', { ascending: false })
      .overrideTypes<DeviceRow[], { merge: false }>(),
  ])

  const alertSettingsByKind = new Map((alertSettingsRows ?? []).map((row) => [row.alert_kind, row]))
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

  const subscriptionActive = tenant.subscription_status === 'active'
  const devices = deviceRows ?? []

  return (
    <>
      <SubHeader
        title="პარამეტრები"
        subtitle="კომპანიის პროფილი · შეტყობინებები · მოწყობილობები · გადახდები"
      />

      <main className="p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <Section
            icon={Building2}
            title="კომპანიის პროფილი"
            subtitle="სახელი, subdomain, დროის სარტყელი + ნაგულისხმევი რადიუსი"
          >
            <CompanyProfileForm
              tenantId={tenant.id}
              name={tenant.name}
              subdomain={tenant.subdomain}
              timezone={tenant.timezone ?? 'Asia/Tbilisi'}
              defaultLanguage={tenant.default_language ?? 'ka'}
              defaultGeofenceRadiusM={tenant.default_geofence_radius_m ?? 100}
            />
          </Section>

          <Section
            icon={Bell}
            title="შეტყობინებები"
            subtitle="თითო ალერტი ცალკე — Push (მობილური აპლიკაცია) + Email"
          >
            <AlertSettingsForm tenantId={tenant.id} initial={initialAlertSettings} />
          </Section>

          <Section
            icon={Smartphone}
            title="ჩემი მოწყობილობები"
            subtitle={`${devices.length} რეგისტრირებული მოწყობილობა`}
          >
            <div className="space-y-4">
              <MobileAppCard variant="compact" />
              <DevicesList devices={devices} />
            </div>
          </Section>

          <Section
            icon={CreditCard}
            title="გადახდები"
            subtitle={
              subscriptionActive
                ? `აქტიური გეგმა: ${tenant.plan_code ?? '—'}`
                : 'ბეტა-ფაზაში უფასოა — Stripe activation მოლოდინშია'
            }
          >
            <Link
              href="/billing"
              className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 transition-colors hover:border-[var(--color-accent)] hover:bg-white"
            >
              <div>
                <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                  ფასების გეგმები
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                  Stripe ჩართვის შემდეგ აქედან მართავ subscription-ს · გადახდის ისტორია ·
                  invoice-ები
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            </Link>
          </Section>
        </div>
      </main>
    </>
  )
}

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Building2
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
      <header className="flex items-start gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--color-accent-tint)] text-[var(--color-accent)]">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">{title}</h2>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">{subtitle}</p>
        </div>
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

function DevicesList({ devices }: { devices: DeviceRow[] }) {
  if (devices.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
        <p className="text-[13px] text-[var(--color-text-secondary)]">ჯერ ერთიც არ არის</p>
        <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
          მობილური აპლიკაციით login-ის შემდეგ device-ი აქ გამოჩნდება.
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-[var(--color-border)]">
      {devices.map((device) => (
        <li key={device.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
              <Smartphone className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13px] font-semibold capitalize text-[var(--color-text-primary)]">
                {device.platform}
                {device.app_version ? (
                  <span className="ml-1.5 text-[11px] font-normal text-[var(--color-text-tertiary)]">
                    v{device.app_version}
                  </span>
                ) : null}
              </p>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                ბოლო აქტიური: {relativeTime(device.last_seen_at)}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function relativeTime(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 1) return 'ახლა'
  if (minutes < 60) return `${minutes} წთ წინ`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} საათის წინ`
  const days = Math.floor(hours / 24)
  return `${days} დღის წინ`
}
