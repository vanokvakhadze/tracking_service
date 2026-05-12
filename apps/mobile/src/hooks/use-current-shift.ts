import { useEffect, useState } from 'react'
import { type CurrentShift, fetchCurrentShift } from '@/src/services/shifts'
import { supabase } from '@/src/services/supabase'

/**
 * Returns the user's current active shift (if any) and re-fetches whenever
 * `shifts` changes via Supabase Realtime.
 */
export function useCurrentShift() {
  const [shift, setShift] = useState<CurrentShift | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const next = await fetchCurrentShift()
      if (!cancelled) {
        setShift(next)
        setLoading(false)
      }
    }
    load()

    const channel = supabase
      .channel('shifts-self')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, () => {
        load()
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  return { shift, loading }
}

/** Format milliseconds as HH:MM:SS for the live timer. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}
