import { AnnotateShiftDialog } from '@/components/reports/AnnotateShiftDialog'
import { createClient } from '@/lib/supabase/server'

interface ShiftUser {
  first_name: string | null
  last_name: string | null
  email: string | null
}

interface ShiftRow {
  id: string
  started_at: string
  ended_at: string | null
  status: string
  notes: string | null
  user: ShiftUser | ShiftUser[] | null
}

interface ShiftsTableProps {
  tenantId: string
  canAnnotate: boolean
}

export async function ShiftsTable({ tenantId, canAnnotate }: ShiftsTableProps) {
  const fromIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const supabase = await createClient()

  const { data } = await supabase
    .from('shifts')
    .select('id, started_at, ended_at, status, notes, user:users(first_name, last_name, email)')
    .eq('tenant_id', tenantId)
    .gte('started_at', fromIso)
    .order('started_at', { ascending: false })
    .limit(200)

  const rows = (data as ShiftRow[] | null | undefined) ?? []

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-white p-10 text-center">
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          ჯერ ცვლების ჩანაწერი არ არის.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
        <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
          ცვლები (ბოლო 30 დღე)
        </h2>
        <p className="text-[11px] text-[var(--color-text-tertiary)]">{rows.length} ჩანაწერი</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <Th>თანამშრომელი</Th>
              <Th>დაწყება</Th>
              <Th>დასრულება</Th>
              <Th>ხანგრძლივობა</Th>
              <Th>სტატუსი</Th>
              <Th>შენიშვნა</Th>
              <Th className="text-right">მოქმედება</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const user = Array.isArray(row.user) ? row.user[0] : row.user
              const name =
                [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || '—'
              const minutes = calculateMinutes(row.started_at, row.ended_at)

              return (
                <tr key={row.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <Td>{name}</Td>
                  <Td>{formatDateTime(row.started_at)}</Td>
                  <Td>{row.ended_at ? formatDateTime(row.ended_at) : '—'}</Td>
                  <Td>{minutes > 0 ? `${minutes} წთ` : '—'}</Td>
                  <Td>{row.status}</Td>
                  <Td>
                    <p
                      className="max-w-[280px] truncate text-[12px] text-[var(--color-text-secondary)]"
                      title={row.notes ?? ''}
                    >
                      {row.notes || '—'}
                    </p>
                  </Td>
                  <Td className="text-right">
                    {canAnnotate ? (
                      <AnnotateShiftDialog shiftId={row.id} initialNotes={row.notes} />
                    ) : (
                      <span className="text-[11px] text-[var(--color-text-tertiary)]">—</span>
                    )}
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={
        'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--color-text-secondary)] ' +
        (className ?? '')
      }
    >
      {children}
    </th>
  )
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={'px-4 py-3 text-[13px] text-[var(--color-text-primary)] ' + (className ?? '')}>
      {children}
    </td>
  )
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('ka-GE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function calculateMinutes(startedAt: string, endedAt: string | null) {
  if (!endedAt) return 0
  return Math.max(
    0,
    Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000),
  )
}
