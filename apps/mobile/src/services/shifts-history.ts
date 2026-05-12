import { supabase } from './supabase'

export interface ShiftHistoryRow {
  id: string
  status: string
  started_at: string
  ended_at: string | null
  total_distance_m: number | null
  total_dwell_minutes: number | null
  locations_visited: number | null
}

export type Range = 'day' | 'week' | 'month'

function rangeStart(range: Range): Date {
  const d = new Date()
  if (range === 'day') {
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (range === 'week') {
    const dayOfWeek = d.getDay() // 0 = Sunday
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    return monday
  }
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function fetchShiftsInRange(range: Range): Promise<ShiftHistoryRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const since = rangeStart(range).toISOString()
  const { data, error } = await supabase
    .from('shifts')
    .select(
      'id, status, started_at, ended_at, total_distance_m, total_dwell_minutes, locations_visited',
    )
    .eq('user_id', user.id)
    .gte('started_at', since)
    .order('started_at', { ascending: false })

  if (error) return []
  return (data ?? []) as ShiftHistoryRow[]
}

export function aggregateTotals(rows: ShiftHistoryRow[]) {
  return rows.reduce(
    (acc, row) => {
      acc.totalMinutes += row.total_dwell_minutes ?? minutesBetween(row.started_at, row.ended_at)
      acc.totalDistanceM += row.total_distance_m ?? 0
      return acc
    },
    { totalMinutes: 0, totalDistanceM: 0 },
  )
}

function minutesBetween(start: string, end: string | null) {
  if (!end) return 0
  return Math.max(0, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000))
}

export function formatHoursMinutes(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60)
  const m = Math.floor(totalMinutes % 60)
  return `${h}ს ${m.toString().padStart(2, '0')}წ`
}
