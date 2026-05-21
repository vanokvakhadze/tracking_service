'use client'

import { Avatar } from '@/components/ui/Avatar'
import { Sparkline } from '@/components/dashboard/Sparkline'
import { MoreHorizontal, Pencil, Phone, Search } from 'lucide-react'
import { type MembershipRow, roleLabels } from './types'

type SortKey = 'visits' | 'productivity' | 'activity'
type SortDirection = 'asc' | 'desc'

interface UsersTableV2Props {
  rows: MembershipRow[]
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  sortKey: SortKey
  sortDirection: SortDirection
  onSortChange: (key: SortKey) => void
}

function pickUser(row: MembershipRow) {
  return Array.isArray(row.user) ? (row.user[0] ?? null) : row.user
}

function initialsOf(first: string | null, last: string | null, email: string) {
  const chars = [first?.[0], last?.[0]]
    .filter((char): char is string => Boolean(char))
    .map((char) => char.toUpperCase())
  if (chars.length > 0) return chars.slice(0, 2).join('')
  return email[0]?.toUpperCase() ?? '?'
}

function displayName(first: string | null, last: string | null, email: string) {
  const full = [first, last].filter(Boolean).join(' ')
  return full || email
}

function scoreTone(score: number) {
  if (score < 50) return 'bg-[var(--color-error)]'
  if (score < 75) return 'bg-[var(--color-warning)]'
  return 'bg-[var(--color-success)]'
}

export function UsersTableV2({
  rows,
  selectedIds,
  onSelectedIdsChange,
  sortKey,
  sortDirection,
  onSortChange,
}: UsersTableV2Props) {
  const rowIds = rows.map((row) => row.id)
  const selectedSet = new Set(selectedIds)
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedSet.has(id))

  function toggleAll() {
    if (allSelected) {
      onSelectedIdsChange(selectedIds.filter((id) => !rowIds.includes(id)))
      return
    }
    onSelectedIdsChange(Array.from(new Set([...selectedIds, ...rowIds])))
  }

  function toggleOne(id: string) {
    if (selectedSet.has(id)) {
      onSelectedIdsChange(selectedIds.filter((selectedId) => selectedId !== id))
      return
    }
    onSelectedIdsChange([...selectedIds, id])
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-[8px] border border-[var(--color-border)] bg-white p-12 text-center">
        <Search className="mx-auto mb-3 h-6 w-6 text-[var(--color-text-tertiary)]" />
        <p className="text-[13px] text-[var(--color-text-secondary)]">თანამშრომელი ვერ მოიძებნა.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-[8px] border border-[var(--color-border)] bg-white">
      <table className="w-full min-w-[1040px] text-left">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <Th className="w-10">
              <input
                aria-label="Select all users"
                checked={allSelected}
                className="h-4 w-4 accent-[var(--color-accent)]"
                onChange={toggleAll}
                type="checkbox"
              />
            </Th>
            <Th>თანამშრომელი</Th>
            <Th>გუნდი</Th>
            <Th>როლი</Th>
            <Th>სტატუსი</Th>
            <SortableTh
              active={sortKey === 'visits'}
              direction={sortDirection}
              label="ვიზიტი 7დ"
              onClick={() => onSortChange('visits')}
            />
            <SortableTh
              active={sortKey === 'productivity'}
              direction={sortDirection}
              label="პროდუქტიულობა"
              onClick={() => onSortChange('productivity')}
            />
            <SortableTh
              active={sortKey === 'activity'}
              direction={sortDirection}
              label="აქტივობა"
              onClick={() => onSortChange('activity')}
            />
            <Th className="text-right">მოქმედება</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const user = pickUser(row)
            if (!user) return null
            const score = Math.round(row.productivity_score ?? 0)
            const checked = selectedSet.has(row.id)
            return (
              <tr
                className="group border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface)]"
                key={row.id}
              >
                <td className="px-4 py-3">
                  <input
                    aria-label={`Select ${user.email}`}
                    checked={checked}
                    className="h-4 w-4 accent-[var(--color-accent)]"
                    onChange={() => toggleOne(row.id)}
                    type="checkbox"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="relative">
                      <Avatar
                        initials={initialsOf(user.first_name, user.last_name, user.email)}
                        seed={user.id}
                        size="lg"
                      />
                      <span
                        className={
                          row.is_active
                            ? 'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--color-success)]'
                            : 'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--color-text-tertiary)]'
                        }
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[var(--color-text-primary)]">
                        {displayName(user.first_name, user.last_name, user.email)}
                      </p>
                      <p className="truncate text-[11px] text-[var(--color-text-tertiary)]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-text-secondary)]">
                    {row.team_name || '-'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <RolePill role={row.role} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge active={row.is_active === true} />
                </td>
                <td className="px-4 py-3 text-[13px] font-semibold tabular-nums text-[var(--color-text-primary)]">
                  {row.visits_7d ?? 0}
                </td>
                <td className="px-4 py-3">
                  <div className="flex min-w-[130px] items-center gap-3">
                    <span className="w-9 text-[12px] font-semibold tabular-nums text-[var(--color-text-primary)]">
                      {score}%
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                      <span
                        className={`block h-full rounded-full ${scoreTone(score)}`}
                        style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
                      />
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Sparkline points={row.activity_trend ?? []} width={88} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <IconButton label="Call">
                      <Phone className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton label="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton label="More">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--color-text-secondary)] ${
        className ?? ''
      }`}
    >
      {children}
    </th>
  )
}

function SortableTh({
  active,
  direction,
  label,
  onClick,
}: {
  active: boolean
  direction: SortDirection
  label: string
  onClick: () => void
}) {
  return (
    <th
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      className="cursor-pointer px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--color-text-secondary)]"
    >
      <button className="inline-flex items-center gap-1" onClick={onClick} type="button">
        {label}
        <span
          className={active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)]'}
        >
          {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  )
}

function RolePill({ role }: { role: string }) {
  const className =
    role === 'tenant_admin' || role === 'super_admin'
      ? 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-text)]'
      : role === 'manager'
        ? 'border-[var(--color-accent-tint)] bg-[var(--color-accent-tint)] text-[var(--color-accent)]'
        : 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]'

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${className}`}
    >
      {roleLabels[role] ?? role}
    </span>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-success-text)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
      აქტიური
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-error-border)] bg-[var(--color-error-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-error-text)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-error)]" />
      გათიშული
    </span>
  )
}

function IconButton({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      className="grid h-7 w-7 place-items-center rounded-[6px] border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
      title={label}
      type="button"
    >
      {children}
    </button>
  )
}
