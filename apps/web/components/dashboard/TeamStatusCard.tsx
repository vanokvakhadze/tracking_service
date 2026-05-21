'use client'

import { Avatar } from '@/components/ui/Avatar'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export interface TeamMemberVM {
  id: string
  user_id: string
  user_name: string
  email: string
  location_name: string | null
  status: 'active' | 'idle' | 'off'
  last_seen_at: string | null
}

interface TeamStatusCardProps {
  tenantId: string
  initialMembers: TeamMemberVM[]
}

interface ShiftUser {
  first_name: string | null
  last_name: string | null
  email: string | null
}

interface ShiftRow {
  id: string
  user_id: string
  started_at: string
  user: ShiftUser | ShiftUser[] | null
}

export function TeamStatusCard({ tenantId, initialMembers }: TeamStatusCardProps) {
  const [members, setMembers] = useState<TeamMemberVM[]>(initialMembers)

  useEffect(() => {
    setMembers(initialMembers)
  }, [initialMembers])

  useEffect(() => {
    if (!tenantId) return
    const supabase = createClient()

    async function refetchActive() {
      const { data } = await supabase
        .from('shifts')
        .select('id, user_id, started_at, user:users(first_name, last_name, email)')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })

      if (!data) return
      const activeRows = (data as ShiftRow[]).map((row) => {
        const user = Array.isArray(row.user) ? row.user[0] : row.user
        const email = user?.email ?? ''
        return {
          id: row.id,
          user_id: row.user_id,
          user_name: [user?.first_name, user?.last_name].filter(Boolean).join(' ') || email || '-',
          email,
          location_name: null,
          status: 'active' as const,
          last_seen_at: row.started_at,
        }
      })

      setMembers((current) => {
        const activeIds = new Set(activeRows.map((row) => row.user_id))
        return [
          ...activeRows,
          ...current
            .filter((member) => !activeIds.has(member.user_id))
            .map((member) => ({
              ...member,
              status: member.status === 'active' ? ('off' as const) : member.status,
            })),
        ].slice(0, 8)
      })
    }

    const channel = supabase
      .channel(`dashboard-team-status-${tenantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts', filter: `tenant_id=eq.${tenantId}` },
        () => {
          void refetchActive()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [tenantId])

  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="border-b border-[var(--color-border)] px-5 py-3">
        <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">გუნდის სტატუსი</h2>
        <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
          Realtime shift updates
        </p>
      </div>
      <div className="p-5">
        {members.length === 0 ? (
          <div className="grid min-h-[220px] place-items-center text-center text-[13px] text-[var(--color-text-secondary)]">
            თანამშრომლები ჯერ არ ჩანს
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {members.slice(0, 8).map((member) => (
              <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" key={member.id}>
                <span className="relative">
                  <Avatar
                    initials={initials(member.user_name, member.email)}
                    seed={member.user_id}
                  />
                  <span
                    className={
                      member.status === 'active'
                        ? 'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--color-success)]'
                        : member.status === 'idle'
                          ? 'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--color-warning)]'
                          : 'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--color-text-tertiary)]'
                    }
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[var(--color-text-primary)]">
                    {member.user_name}
                  </p>
                  <p className="truncate text-[11px] text-[var(--color-text-secondary)]">
                    {member.location_name ?? 'ლოკაცია ცნობდება'}
                  </p>
                </div>
                <div className="text-right">
                  <StatusPill status={member.status} />
                  <p className="mt-1 text-[10px] tabular-nums text-[var(--color-text-tertiary)]">
                    {formatRelative(member.last_seen_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function StatusPill({ status }: { status: TeamMemberVM['status'] }) {
  const className =
    status === 'active'
      ? 'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
      : status === 'idle'
        ? 'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'
        : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${className}`}>
      {status === 'active' ? 'active' : status === 'idle' ? 'idle' : 'off'}
    </span>
  )
}

function initials(name: string, email: string) {
  const chars = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
  return chars.toUpperCase() || email[0]?.toUpperCase() || '?'
}

function formatRelative(iso: string | null) {
  if (!iso) return '-'
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}წ`
  return `${Math.floor(minutes / 60)}ს`
}
