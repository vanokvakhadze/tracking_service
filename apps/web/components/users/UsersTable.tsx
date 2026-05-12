import { type MembershipRow, roleLabels } from './types'

interface UsersTableProps {
  rows: MembershipRow[]
}

function pickUser(row: MembershipRow) {
  return Array.isArray(row.user) ? (row.user[0] ?? null) : row.user
}

function initialsOf(first: string | null, last: string | null, email: string) {
  const chars = [first?.[0], last?.[0]]
    .filter((c): c is string => Boolean(c))
    .map((c) => c.toUpperCase())
  if (chars.length > 0) return chars.slice(0, 2).join('')
  return email[0]?.toUpperCase() ?? '?'
}

function displayName(first: string | null, last: string | null, email: string) {
  const full = [first, last].filter(Boolean).join(' ')
  return full || email
}

function formatRelative(iso: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 1) return 'დღეს'
  if (diffDays === 1) return 'გუშინ'
  if (diffDays < 7) return `${diffDays} დღის წინ`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} კვირის წინ`
  return date.toLocaleDateString('ka-GE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function UsersTable({ rows }: UsersTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-white p-12 text-center">
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          ჯერ თანამშრომელი არ მოგიწვევია.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <Th>თანამშრომელი</Th>
            <Th>როლი</Th>
            <Th>სტატუსი</Th>
            <Th>ბოლო შესვლა</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const user = pickUser(row)
            if (!user) return null
            return (
              <tr
                key={row.id}
                className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface)]"
              >
                <td className="px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-tint)] text-[12px] font-semibold text-[var(--color-accent)]">
                      {initialsOf(user.first_name, user.last_name, user.email)}
                    </span>
                    <div className="leading-tight">
                      <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                        {displayName(user.first_name, user.last_name, user.email)}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)]">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3.5 py-2.5 text-[13px] text-[var(--color-text-primary)]">
                  {roleLabels[row.role] ?? row.role}
                </td>
                <td className="px-3.5 py-2.5">
                  <StatusBadge active={row.is_active === true} />
                </td>
                <td className="px-3.5 py-2.5 text-[12px] text-[var(--color-text-secondary)]">
                  {formatRelative(user.last_login_at)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
      {children}
    </th>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-success-text)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
        აქტიური
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-tertiary)]" />
      შეჩერებული
    </span>
  )
}
