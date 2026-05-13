'use client'

import { ChevronRight, Search } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

export interface TenantRow {
  id: string
  name: string
  subdomain: string | null
  status: string | null
  plan_code: string | null
  subscription_status: string | null
  subscription_quantity: number | null
  current_period_end: string | null
  trial_ends_at: string | null
  created_at: string | null
}

interface TenantsTableProps {
  rows: TenantRow[]
  planPriceByCode: Map<string, number>
}

type Filter = 'all' | 'pro' | 'basic' | 'trial'

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  active: {
    label: 'active',
    classes:
      'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
  },
  trialing: {
    label: 'trial',
    classes:
      'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]',
  },
  past_due: {
    label: 'past_due',
    classes:
      'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]',
  },
  canceled: {
    label: 'canceled',
    classes:
      'border-[var(--color-error-border)] bg-[var(--color-error-bg)] text-[var(--color-error-text)]',
  },
  unpaid: {
    label: 'unpaid',
    classes:
      'border-[var(--color-error-border)] bg-[var(--color-error-bg)] text-[var(--color-error-text)]',
  },
}

export function TenantsTable({ rows, planPriceByCode }: TenantsTableProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((t) => {
      if (filter === 'pro' && t.plan_code !== 'pro') return false
      if (filter === 'basic' && t.plan_code !== 'basic') return false
      if (filter === 'trial' && t.subscription_status !== 'trialing') return false
      if (!q) return true
      const haystack = [t.name, t.subdomain].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [rows, filter, search])

  return (
    <div className="overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-1.5">
          {(
            [
              ['all', `ყველა · ${rows.length}`],
              ['pro', 'Pro'],
              ['basic', 'Basic'],
              ['trial', 'Trial'],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button
              type="button"
              key={key}
              onClick={() => setFilter(key)}
              className={
                filter === key
                  ? 'inline-flex h-7 items-center rounded-full bg-[var(--color-accent-tint)] px-3 text-[12px] font-medium text-[var(--color-accent-hover)]'
                  : 'inline-flex h-7 items-center rounded-full border border-[var(--color-border)] bg-white px-3 text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ძებნა..."
            className="h-8 w-full rounded-[6px] border border-[var(--color-border)] bg-white pl-9 pr-3 text-[13px] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center text-[13px] text-[var(--color-text-secondary)]">
          tenants matching filter არ მოიძებნა
        </div>
      ) : (
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <Th>კომპანია</Th>
              <Th>Plan</Th>
              <Th>Seats</Th>
              <Th>MRR</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th className="w-10">{''}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const price = planPriceByCode.get(t.plan_code ?? '') ?? 0
              const quantity = t.subscription_quantity ?? 0
              const mrr = t.subscription_status === 'active' ? price * quantity : 0
              const status = t.subscription_status
                ? (STATUS_BADGE[t.subscription_status] ?? {
                    label: t.subscription_status,
                    classes:
                      'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]',
                  })
                : null
              return (
                <tr
                  key={t.id}
                  className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface)]"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">{t.name}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                        {t.subdomain ?? '—'}.trackpro.ge
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-[var(--color-text-primary)]">
                    {t.plan_code ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-primary)] tabular-nums">
                    {quantity}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-primary)] tabular-nums">
                    {mrr.toFixed(0)} GEL
                  </td>
                  <td className="px-4 py-3">
                    {status && (
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.classes}`}
                      >
                        {status.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[var(--color-text-secondary)]">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString('ka-GE') : '—'}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <Link
                      href={`/platform/tenants/${t.id}`}
                      className="inline-flex items-center text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)]"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] ${className ?? ''}`}
    >
      {children}
    </th>
  )
}
