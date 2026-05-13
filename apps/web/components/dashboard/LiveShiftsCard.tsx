'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface LiveShift {
  id: string
  user_id: string
  user_name: string
  started_at: string
  location_name: string | null
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

interface Props {
  tenantId: string
  initialShifts: LiveShift[]
}

export function LiveShiftsCard({ tenantId, initialShifts }: Props) {
  const [shifts, setShifts] = useState<LiveShift[]>(initialShifts)

  useEffect(() => {
    setShifts(initialShifts)
  }, [initialShifts])

  useEffect(() => {
    if (!tenantId) return

    const supabase = createClient()

    async function refetch() {
      const { data } = await supabase
        .from('shifts')
        .select('id, user_id, started_at, user:users(first_name, last_name, email)')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })

      if (!data) return

      setShifts(
        (data as ShiftRow[]).map((row) => {
          const user = Array.isArray(row.user) ? row.user[0] : row.user
          const userName =
            [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || '—'

          return {
            id: row.id,
            user_id: row.user_id,
            user_name: userName,
            started_at: row.started_at,
            location_name: null,
          }
        }),
      )
    }

    const channel = supabase
      .channel(`dashboard-shifts-${tenantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts', filter: `tenant_id=eq.${tenantId}` },
        () => {
          void refetch()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [tenantId])

  if (shifts.length === 0) {
    return (
      <div className="grid h-[360px] place-items-center px-6 text-center">
        <div>
          <p className="text-[13px] text-[var(--color-text-secondary)]">ჯერ ცვლები არ არის.</p>
          <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
            მობილური აპლიკაციით ცვლის დაწყების შემდეგ აქ ცოცხლად გამოჩნდება.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-[var(--color-border)]">
      {shifts.map((shift) => (
        <li key={shift.id} className="flex items-center justify-between px-5 py-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-[var(--color-text-primary)]">
              {shift.user_name}
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              {shift.location_name ?? 'ლოკაცია ცნობდება…'}
            </p>
          </div>
          <span className="rounded-full bg-[var(--color-success-bg)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--color-success-text)]">
            {formatElapsed(shift.started_at)}
          </span>
        </li>
      ))}
    </ul>
  )
}

function formatElapsed(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  const hours = Math.floor(minutes / 60)
  const restMinutes = minutes % 60
  return `${hours}ს ${restMinutes.toString().padStart(2, '0')}წ`
}
