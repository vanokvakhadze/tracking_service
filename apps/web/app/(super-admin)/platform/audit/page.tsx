import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface AuditRow {
  id: number
  tenant_id: string | null
  actor_user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  occurred_at: string | null
  actor:
    | { email: string; first_name: string | null; last_name: string | null }
    | {
        email: string
        first_name: string | null
        last_name: string | null
      }[]
    | null
}

export default async function AuditLogPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('audit_logs')
    .select(
      'id, tenant_id, actor_user_id, action, entity_type, entity_id, metadata, ip_address, occurred_at, actor:users!audit_logs_actor_user_id_fkey(email, first_name, last_name)',
    )
    .order('occurred_at', { ascending: false })
    .limit(200)
    .overrideTypes<AuditRow[], { merge: false }>()

  const rows = data ?? []

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-[24px] font-bold tracking-tight text-[var(--color-text-primary)]">
          Audit log
        </h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
          ბოლო {rows.length} platform / admin მოქმედება. Append-only.
        </p>
      </header>

      <div className="overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-white">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-[13px] text-[var(--color-text-secondary)]">
            ჩანაწერი ჯერ არ არის. პლატფორმის მოქმედებები აქ ჩაიწერება, როცა Impersonation, ხელით
            plan ცვლა, ან tenant suspend მოხდება.
          </div>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <Th>დრო</Th>
                <Th>Actor</Th>
                <Th>Action</Th>
                <Th>Entity</Th>
                <Th>IP</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const actor = Array.isArray(row.actor) ? row.actor[0] : row.actor
                const actorName =
                  [actor?.first_name, actor?.last_name].filter(Boolean).join(' ') ||
                  actor?.email ||
                  '—'
                return (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--color-border)] last:border-b-0"
                  >
                    <td className="px-4 py-3 text-[12px] text-[var(--color-text-secondary)] tabular-nums">
                      {row.occurred_at ? new Date(row.occurred_at).toLocaleString('ka-GE') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--color-text-primary)]">{actorName}</p>
                      {actor?.email && (
                        <p className="text-[11px] text-[var(--color-text-tertiary)]">
                          {actor.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[var(--color-text-primary)]">
                      {row.action}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[var(--color-text-secondary)]">
                      {row.entity_type && (
                        <div>
                          <span className="font-mono">{row.entity_type}</span>
                          {row.entity_id && (
                            <span className="ml-1 text-[var(--color-text-tertiary)]">
                              {row.entity_id.slice(0, 8)}…
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[var(--color-text-tertiary)] tabular-nums">
                      {row.ip_address ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
      {children}
    </th>
  )
}
