import { useEffect, useState } from 'react'
import { fetchAdminSnapshot, type AdminSnapshot } from '@/src/services/admin-dashboard'
import { supabase } from '@/src/services/supabase'

export function useAdminSnapshot() {
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function refresh() {
    setRefreshing(true)
    const next = await fetchAdminSnapshot()
    setSnapshot(next)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      const next = await fetchAdminSnapshot()
      if (!cancelled) {
        setSnapshot(next)
        setLoading(false)
      }
    }
    load()

    const channel = supabase
      .channel('admin-shifts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, () => {
        load()
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  return { snapshot, loading, refreshing, refresh }
}
