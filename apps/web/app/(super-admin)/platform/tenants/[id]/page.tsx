import { ImpersonateButton } from '@/components/platform/ImpersonateButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Mail, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface TenantDetailRow {
  id: string
  name: string
  subdomain: string | null
  status: string
  plan_code: string | null
  subscription_status: string | null
  subscription_quantity: number | null
  current_period_end: string | null
  trial_ends_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string | null
  timezone: string | null
  default_language: string | null
}

interface MembershipDetailRow {
  id: string
  role: string
  is_active: boolean | null
  created_at: string | null
  user:
    | { id: string; email: string; first_name: string | null; last_name: string | null }[]
    | {
        id: string
        email: string
        first_name: string | null
        last_name: string | null
      }
    | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TenantDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: tenant }, { data: memberships }, { count: locationCount }, { count: shiftCount }] =
    await Promise.all([
      supabase
        .from('tenants')
        .select(
          'id, name, subdomain, status, plan_code, subscription_status, subscription_quantity, current_period_end, trial_ends_at, stripe_customer_id, stripe_subscription_id, created_at, timezone, default_language',
        )
        .eq('id', id)
        .single()
        .overrideTypes<TenantDetailRow, { merge: false }>(),
      supabase
        .from('tenant_memberships')
        .select('id, role, is_active, created_at, user:users(id, email, first_name, last_name)')
        .eq('tenant_id', id)
        .order('created_at', { ascending: false })
        .overrideTypes<MembershipDetailRow[], { merge: false }>(),
      supabase
        .from('locations')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', id)
        .is('deleted_at', null),
      supabase.from('shifts').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
    ])

  if (!tenant) notFound()

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString('ka-GE', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '—'

  return (
    <div className="p-6 space-y-6">
      <Link
        href="/platform"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Tenants
      </Link>

      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-[var(--color-text-primary)]">
          {tenant.name}
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
          {tenant.subdomain ?? 'no-subdomain'}.trackpro.ge · შექმნილია{' '}
          {formatDate(tenant.created_at)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DetailCard title="Account">
          <DetailRow label="Status" value={tenant.status} />
          <DetailRow label="Timezone" value={tenant.timezone ?? 'Asia/Tbilisi'} />
          <DetailRow label="Language" value={tenant.default_language ?? 'ka'} />
        </DetailCard>
        <DetailCard title="Subscription">
          <DetailRow label="Plan" value={tenant.plan_code ?? '—'} />
          <DetailRow label="Status" value={tenant.subscription_status ?? '—'} />
          <DetailRow label="Seats" value={String(tenant.subscription_quantity ?? 0)} />
          <DetailRow
            label="Next billing"
            value={formatDate(tenant.current_period_end ?? tenant.trial_ends_at)}
          />
        </DetailCard>
        <DetailCard title="Stripe">
          <DetailRow label="Customer" value={tenant.stripe_customer_id ?? '—'} mono />
          <DetailRow label="Subscription" value={tenant.stripe_subscription_id ?? '—'} mono />
          {tenant.stripe_customer_id && (
            <a
              href={`https://dashboard.stripe.com/test/customers/${tenant.stripe_customer_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[12px] text-[var(--color-accent-hover)] hover:underline"
            >
              Open in Stripe →
            </a>
          )}
        </DetailCard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Members" value={String(memberships?.length ?? 0)} />
        <StatTile label="Locations" value={String(locationCount ?? 0)} />
        <StatTile label="Total shifts" value={String(shiftCount ?? 0)} />
      </div>

      <div className="rounded-[10px] border border-[var(--color-border)] bg-white overflow-hidden">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
          <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">Team</h2>
        </div>
        {memberships && memberships.length > 0 ? (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  მომხმარებელი
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Role
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Active
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Joined
                </th>
                <th className="w-32 px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  {''}
                </th>
              </tr>
            </thead>
            <tbody>
              {memberships.map((m) => {
                const user = Array.isArray(m.user) ? m.user[0] : m.user
                const displayName =
                  [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
                  user?.email ||
                  '—'
                return (
                  <tr key={m.id} className="border-b border-[var(--color-border)] last:border-b-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--color-text-primary)]">{displayName}</p>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)]">
                        <Mail className="h-3 w-3" />
                        {user?.email ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-primary)]">{m.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          m.is_active
                            ? 'inline-flex items-center rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-success-text)]'
                            : 'inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-tertiary)]'
                        }
                      >
                        {m.is_active ? 'active' : 'inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[var(--color-text-secondary)]">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user?.id && (
                        <ImpersonateButton
                          userId={user.id}
                          tenantId={id}
                          displayName={displayName}
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="ჯერ წევრები არ შემოერთებიან"
            description="როცა admin ვინმეს invite-ს გაუგზავნის, აქ გამოჩნდება."
          />
        )}
      </div>
    </div>
  )
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-[var(--color-border)] bg-white">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {title}
        </h2>
      </div>
      <div className="px-5 py-4 space-y-2">{children}</div>
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </span>
      <span
        className={`text-[12px] text-[var(--color-text-primary)] truncate max-w-[60%] text-right ${
          mono ? 'font-mono' : ''
        }`}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[var(--color-border)] bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </p>
      <p className="mt-1 text-[24px] font-bold tabular-nums text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  )
}
