'use client'

import { createClient } from '@/lib/supabase/client'
import { Pause, Play } from 'lucide-react'
import { useEffect, useState } from 'react'

export interface FeedEvent {
  id: string
  user_id: string
  user_name: string
  event_type: string
  occurred_at: string
  location_name: string | null
}

interface LiveFeedProps {
  tenantId: string
  initialEvents: FeedEvent[]
}

export function LiveFeed({ tenantId, initialEvents }: LiveFeedProps) {
  const [events, setEvents] = useState(initialEvents)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  useEffect(() => {
    if (!tenantId || paused) return
    const supabase = createClient()
    const channel = supabase
      .channel(`reports-feed-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'geofence_events',
          filter: `tenant_id=eq.${tenantId}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string
            user_id: string
            event_type: string
            occurred_at: string
            location_id: string
          }
          const [{ data: user }, { data: location }] = await Promise.all([
            supabase
              .from('users')
              .select('first_name, last_name, email')
              .eq('id', row.user_id)
              .single(),
            supabase.from('locations').select('name').eq('id', row.location_id).single(),
          ])
          const userName =
            [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
            user?.email ||
            row.user_id
          setEvents((current) =>
            [
              {
                id: row.id,
                user_id: row.user_id,
                user_name: userName,
                event_type: row.event_type,
                occurred_at: row.occurred_at,
                location_name: location?.name ?? null,
              },
              ...current,
            ].slice(0, 30),
          )
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [tenantId, paused])

  return (
    <section className="rounded-[8px] border border-[var(--color-border)] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-3">
        <div>
          <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">Live feed</h2>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
            ბოლო geofence მოვლენები
          </p>
        </div>
        <button
          className="grid h-8 w-8 place-items-center rounded-[4px] border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
          onClick={() => setPaused((value) => !value)}
          type="button"
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
      </div>
      <div className="max-h-[280px] overflow-auto p-5">
        {events.length === 0 ? (
          <div className="grid place-items-center py-10 text-center">
            <div>
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
              </span>
              <p className="mt-3 text-[13px] font-semibold text-[var(--color-text-primary)]">
                მონაცემები მზადდება
              </p>
              <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                ცვლის enter / exit events აქ ცოცხლად შემოვა.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li className="flex gap-3" key={event.id}>
                <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-[var(--color-text-primary)]">
                    {event.user_name} · {event.event_type}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">
                    {event.location_name ?? 'ლოკაცია'} · {formatTime(event.occurred_at)}
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

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('ka-GE', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  )
}
