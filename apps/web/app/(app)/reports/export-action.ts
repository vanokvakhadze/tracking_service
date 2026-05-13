'use server'

import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

interface ExportInput {
  fromIso?: string
  toIso?: string
}

interface ExportRow {
  shift_id: string
  user_name: string
  user_email: string
  started_at: string
  ended_at: string | null
  total_minutes: number
  status: string
  notes: string | null
}

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

export async function exportShiftsCsv(input: ExportInput): Promise<string> {
  const me = await getCurrentUser()
  const tenantId = me?.memberships?.find((membership) => membership.is_active)?.tenant?.id

  if (!tenantId) throw new Error('Not in a tenant')

  const supabase = await createClient()

  let query = supabase
    .from('shifts')
    .select('id, started_at, ended_at, status, notes, user:users(first_name, last_name, email)')
    .eq('tenant_id', tenantId)
    .order('started_at', { ascending: false })
    .limit(5000)

  if (input.fromIso) query = query.gte('started_at', input.fromIso)
  if (input.toIso) query = query.lte('started_at', input.toIso)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows: ExportRow[] =
    (data as ShiftRow[] | null | undefined)?.map((row) => {
      const user = Array.isArray(row.user) ? row.user[0] : row.user
      const userName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || ''
      const totalMinutes = row.ended_at
        ? Math.round(
            (new Date(row.ended_at).getTime() - new Date(row.started_at).getTime()) / 60000,
          )
        : 0

      return {
        shift_id: row.id,
        user_name: userName,
        user_email: user?.email ?? '',
        started_at: row.started_at,
        ended_at: row.ended_at,
        total_minutes: totalMinutes,
        status: row.status,
        notes: row.notes,
      }
    }) ?? []

  return toCsv(rows)
}

function toCsv(rows: ExportRow[]): string {
  const header = [
    'shift_id',
    'user_name',
    'user_email',
    'started_at',
    'ended_at',
    'total_minutes',
    'status',
    'notes',
  ]

  const escape = (value: string | number | null) => {
    if (value === null || value === undefined) return ''
    const stringValue = String(value)
    return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue
  }

  const lines = [header.join(',')]

  for (const row of rows) {
    lines.push(
      [
        row.shift_id,
        row.user_name,
        row.user_email,
        row.started_at,
        row.ended_at ?? '',
        row.total_minutes,
        row.status,
        row.notes ?? '',
      ]
        .map(escape)
        .join(','),
    )
  }

  return lines.join('\n')
}
