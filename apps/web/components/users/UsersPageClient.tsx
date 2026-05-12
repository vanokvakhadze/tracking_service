'use client'

import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SubHeader } from '@/components/layout/SubHeader'
import { Button } from '@/components/ui/Button'
import type { MembershipRow } from './types'
import { InviteUserDialog } from './InviteUserDialog'
import { UsersTable } from './UsersTable'

type StatusFilter = 'all' | 'active' | 'suspended' | 'pending'

interface UsersPageClientProps {
  initialRows: MembershipRow[]
}

export function UsersPageClient({ initialRows }: UsersPageClientProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)

  const filtered = useMemo(() => {
    if (statusFilter === 'pending') return [] // pending invites tracked separately, surfaced in v2
    const q = search.trim().toLowerCase()
    return initialRows.filter((row) => {
      const active = row.is_active === true
      if (statusFilter === 'active' && !active) return false
      if (statusFilter === 'suspended' && active) return false
      if (!q) return true
      const user = Array.isArray(row.user) ? row.user[0] : row.user
      const haystack = [user?.first_name, user?.last_name, user?.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [initialRows, statusFilter, search])

  const counts = useMemo(
    () => ({
      all: initialRows.length,
      active: initialRows.filter((r) => r.is_active === true).length,
      suspended: initialRows.filter((r) => r.is_active !== true).length,
      pending: 0, // hook up to invitations table count in a follow-up
    }),
    [initialRows],
  )

  return (
    <>
      <SubHeader
        title="მომხმარებლები"
        subtitle={`${counts.active} აქტიური · ${counts.suspended} გათიშული · ${counts.pending} მოლოდინში`}
        actions={
          <Button onClick={() => setInviteOpen(true)} size="md">
            <Plus className="h-4 w-4" />
            მოწვევა
          </Button>
        }
      />

      <div className="p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <FilterPill
              label="ყველა"
              count={counts.all}
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
            />
            <FilterPill
              label="აქტიური"
              count={counts.active}
              active={statusFilter === 'active'}
              onClick={() => setStatusFilter('active')}
            />
            <FilterPill
              label="გათიშული"
              count={counts.suspended}
              active={statusFilter === 'suspended'}
              onClick={() => setStatusFilter('suspended')}
            />
            <FilterPill
              label="მოლოდინში"
              count={counts.pending}
              active={statusFilter === 'pending'}
              onClick={() => setStatusFilter('pending')}
            />
          </div>

          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ძებნა სახელით ან ემაილით..."
              className="h-8 w-full rounded-[6px] border border-[var(--color-border)] bg-white pl-9 pr-3 text-[13px] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
            />
          </div>
        </div>

        <UsersTable rows={filtered} />
      </div>

      <InviteUserDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  )
}

interface FilterPillProps {
  label: string
  count: number
  active: boolean
  onClick: () => void
}

function FilterPill({ label, count, active, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'inline-flex h-7 items-center gap-1.5 rounded-full bg-[var(--color-accent-tint)] px-3 text-[12px] font-medium text-[var(--color-accent)]'
          : 'inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-3 text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
      }
    >
      {label}
      <span
        className={
          active
            ? 'rounded-full bg-white/60 px-1.5 text-[10px] font-semibold text-[var(--color-accent)]'
            : 'rounded-full bg-[var(--color-surface-2)] px-1.5 text-[10px] font-semibold text-[var(--color-text-secondary)]'
        }
      >
        {count}
      </span>
    </button>
  )
}
