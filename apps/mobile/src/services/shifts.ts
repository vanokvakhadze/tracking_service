import { supabase } from './supabase'

export interface CurrentShift {
  id: string
  status: 'active' | 'completed' | 'auto_closed' | 'invalid'
  started_at: string
  ended_at: string | null
  total_distance_m: number | null
  total_dwell_minutes: number | null
  locations_visited: number | null
}

/** The user's most recent active shift, if any. */
export async function fetchCurrentShift(): Promise<CurrentShift | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Drain any shift whose 60s exit timer has elapsed before we read state.
  // RPC is added in migration 15 — drop the cast after `pnpm db:types`.
  // biome-ignore lint/suspicious/noExplicitAny: see comment above
  await (supabase.rpc as any)('finalize_pending_shifts')

  const { data, error } = await supabase
    .from('shifts')
    .select(
      'id, status, started_at, ended_at, total_distance_m, total_dwell_minutes, locations_visited',
    )
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return data as CurrentShift | null
}
