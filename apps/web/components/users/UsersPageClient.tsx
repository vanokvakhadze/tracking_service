'use client'

import { SubHeader } from '@/components/layout/SubHeader'
import { Button } from '@/components/ui/Button'
import { FileUp, ListFilter, Plus, Search, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BulkActionBar } from './BulkActionBar'
import { BulkInviteDialog } from './BulkInviteDialog'
import { InviteBanner } from './InviteBanner'
import { InviteUserDialog } from './InviteUserDialog'
import { PendingInvitationsCard } from './PendingInvitationsCard'
import { StatusChips } from './StatusChips'
import { UserStatStrip } from './UserStatStrip'
import { UsersTableV2 } from './UsersTableV2'
import type { MembershipRow, PendingInvitationRow, UsersStats } from './types'

export type StatusFilter = 'all' | 'active' | 'suspended' | 'pending'
type SortKey = 'visits' | 'productivity' | 'activity'
type SortDirection = 'asc' | 'desc'

interface UsersPageClientProps {
  initialRows: MembershipRow[]
  pendingInvitations: PendingInvitationRow[]
  stats: UsersStats
  canBulkInvite?: boolean
}

export function UsersPageClient({
  initialRows,
  pendingInvitations,
  stats,
  canBulkInvite = false,
}: UsersPageClientProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('activity')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows =
      statusFilter === 'pending'
        ? []
        : initialRows.filter((row) => {
            const active = row.is_active === true
            if (statusFilter === 'active' && !active) return false
            if (statusFilter === 'suspended' && active) return false
            if (!q) return true
            const user = Array.isArray(row.user) ? row.user[0] : row.user
            const haystack = [
              user?.first_name,
              user?.last_name,
              user?.email,
              row.employee_code,
              row.team_name,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
            return haystack.includes(q)
          })

    return [...rows].sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1
      if (sortKey === 'visits') return ((a.visits_7d ?? 0) - (b.visits_7d ?? 0)) * direction
      if (sortKey === 'productivity') {
        return ((a.productivity_score ?? 0) - (b.productivity_score ?? 0)) * direction
      }
      const aUser = Array.isArray(a.user) ? a.user[0] : a.user
      const bUser = Array.isArray(b.user) ? b.user[0] : b.user
      return (
        (new Date(aUser?.last_login_at ?? 0).getTime() -
          new Date(bUser?.last_login_at ?? 0).getTime()) *
        direction
      )
    })
  }, [initialRows, statusFilter, search, sortKey, sortDirection])

  const counts = useMemo(
    () => ({
      all: initialRows.length,
      active: initialRows.filter((row) => row.is_active === true).length,
      suspended: initialRows.filter((row) => row.is_active !== true).length,
      pending: pendingInvitations.filter(
        (invitation) => new Date(invitation.expires_at).getTime() > Date.now(),
      ).length,
    }),
    [initialRows, pendingInvitations],
  )

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((row) => selectedIds.includes(row.id))

  function changeSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection('desc')
  }

  function selectAllVisible() {
    const visibleIds = filtered.map((row) => row.id)
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !visibleIds.includes(id)))
      return
    }
    setSelectedIds((current) => Array.from(new Set([...current, ...visibleIds])))
  }

  function openBulkDialog() {
    setBulkOpen(true)
  }

  function openInviteDialog() {
    setInviteOpen(true)
  }

  return (
    <>
      <SubHeader
        title="მომხმარებლები"
        subtitle={`${counts.all} ჯამური · ${counts.active} აქტიური · ${counts.suspended} გათიშული · ${counts.pending} მოლოდინში`}
        actions={
          <>
            {canBulkInvite && (
              <Button onClick={openBulkDialog} size="md" variant="secondary">
                <FileUp className="h-4 w-4" />
                CSV იმპორტი
              </Button>
            )}
            <Button onClick={openInviteDialog} size="md">
              <Plus className="h-4 w-4" />
              მოწვევა
            </Button>
          </>
        }
      />

      <main className="space-y-6 p-6">
        <UserStatStrip stats={stats} />
        <InviteBanner onCsv={openBulkDialog} onInvite={openInviteDialog} />

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <StatusChips counts={counts} onChange={setStatusFilter} value={statusFilter} />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
              <input
                className="h-9 w-full rounded-[8px] border border-[var(--color-border)] bg-white pl-9 pr-3 text-[13px] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ძიება სახელით, email-ით ან ID-ით..."
                type="search"
                value={search}
              />
            </div>
            <Button size="md" variant="secondary">
              <ListFilter className="h-4 w-4" />
              ფილტრი
            </Button>
            <Button size="md" variant="secondary">
              <UsersRound className="h-4 w-4" />
              დაჯგუფება
            </Button>
          </div>
        </div>

        <BulkActionBar
          allSelected={allVisibleSelected}
          onClear={() => setSelectedIds([])}
          onSelectAll={selectAllVisible}
          selectedIds={selectedIds}
        />

        <UsersTableV2
          onSelectedIdsChange={setSelectedIds}
          onSortChange={changeSort}
          rows={filtered}
          selectedIds={selectedIds}
          sortDirection={sortDirection}
          sortKey={sortKey}
        />

        <PendingInvitationsCard invitations={pendingInvitations} />
      </main>

      <InviteUserDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
      {canBulkInvite && <BulkInviteDialog open={bulkOpen} onClose={() => setBulkOpen(false)} />}
    </>
  )
}
