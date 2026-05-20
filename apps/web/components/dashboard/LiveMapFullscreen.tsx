'use client'

import { useEffect, useState } from 'react'
import { MapboxMap, type MarkerSpec } from '@/components/map/MapboxMap'
import type { LiveShift } from '@/components/dashboard/LiveShiftsCard'
import type { LocationRow } from '@/components/locations/types'
import { createClient } from '@/lib/supabase/client'

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
  locations: LocationRow[]
  initialShifts: LiveShift[]
}

export function LiveMapFullscreen({ tenantId, locations, initialShifts }: Props) {
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
      .channel(`live-map-shifts-${tenantId}`)
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

  const markers: MarkerSpec[] = locations
    .filter(
      (l): l is LocationRow & { latitude: number; longitude: number } =>
        l.latitude !== null && l.longitude !== null,
    )
    .map((l) => ({
      id: l.id,
      lat: l.latitude,
      lng: l.longitude,
      color: l.is_active ? '#1565C0' : '#94A3B8',
    }))

  const center = markers.length > 0 ? { lat: markers[0]!.lat, lng: markers[0]!.lng } : undefined

  return (
    <div className="grid h-[calc(100vh-110px)] grid-cols-1 lg:grid-cols-[1fr_320px]">
      <div className="relative">
        <MapboxMap className="h-full w-full" center={center} zoom={12} markers={markers} />
      </div>

      <aside className="border-l border-[var(--color-border)] bg-white overflow-y-auto">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
          <h2 className="text-[13px] font-bold text-[var(--color-text-primary)]">აქტიური ცვლები</h2>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            {shifts.length} თანამშრომელი
          </p>
        </div>

        {shifts.length === 0 ? (
          <div className="grid place-items-center p-10 text-center">
            <div>
              <p className="text-[13px] text-[var(--color-text-secondary)]">ჯერ ცვლები არ არის.</p>
              <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
                მობილური აპლიკაციით ცვლის დაწყების შემდეგ აქ ცოცხლად გამოჩნდება.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {shifts.map((shift) => (
              <li key={shift.id} className="px-5 py-3">
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                  {shift.user_name}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                  {formatElapsed(shift.started_at)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-[var(--color-border)] px-5 py-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">
            ლოკაციები ({locations.length})
          </h3>
          <ul className="mt-2 space-y-1">
            {locations.map((location) => (
              <li
                key={location.id}
                className="flex items-center gap-2 text-[12px] text-[var(--color-text-secondary)]"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: location.is_active ? '#1565C0' : '#94A3B8' }}
                />
                <span className="truncate">{location.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}

function formatElapsed(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${hours}ს ${rest.toString().padStart(2, '0')}წ აქტიური`
}
