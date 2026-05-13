# task.047 — Web dashboard live shifts (Supabase Realtime)

**Type:** 🤖 Codex
**Phase:** 7 — Polish (post-Phase 3-Lite)
**Depends on:** Phase 3-Lite (already shipped, commit 828d24c)
**Commit:** `feat(dashboard): live shifts via supabase realtime`

---

## Read first
- `tasks/00_HANDOFF.md`
- `apps/web/app/(app)/dashboard/page.tsx` — current SSR dashboard
- `apps/mobile/src/screens/admin/TeamMapScreen.tsx` — see how mobile already
  uses Supabase Realtime (`supabase.channel('admin-team-pings').on(...)`)

## Goal
The web `/dashboard` currently fetches `locations` server-side and shows a
hard-coded "ჯერ ცვლები არ არის" empty card on the right. With Phase 3-Lite
hitting the geofence-event Edge Function, the `shifts` table now actually
gets `INSERT`s + `UPDATE`s in production. We want the admin to see them
flow in live without manually refreshing.

Pattern: keep the Server Component as the initial render (SSR-friendly,
SEO-safe) but pass the first batch into a small Client Component that
subscribes to Realtime for updates.

## Files to add

### `apps/web/components/dashboard/LiveShiftsCard.tsx`
```tsx
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

interface Props {
  tenantId: string
  initialShifts: LiveShift[]
}

export function LiveShiftsCard({ tenantId, initialShifts }: Props) {
  const [shifts, setShifts] = useState<LiveShift[]>(initialShifts)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`dashboard-shifts-${tenantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts', filter: `tenant_id=eq.${tenantId}` },
        () => {
          // On any change, refetch the active list. Cheap because admins
          // typically have <100 active shifts; complex diffing isn't worth
          // it for v1.
          void refetch()
        },
      )
      .subscribe()

    async function refetch() {
      const { data } = await supabase
        .from('shifts')
        .select('id, user_id, started_at, user:users(first_name, last_name, email)')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
      if (!data) return
      setShifts(
        data.map((row) => {
          const u = Array.isArray(row.user) ? row.user[0] : row.user
          const name = [u?.first_name, u?.last_name].filter(Boolean).join(' ') || u?.email || '—'
          return {
            id: row.id,
            user_id: row.user_id,
            user_name: name,
            started_at: row.started_at,
            location_name: null,
          }
        }),
      )
    }

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [tenantId])

  if (shifts.length === 0) {
    return (
      <div className="h-[360px] grid place-items-center text-center px-6">
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
          <span className="rounded-full bg-[var(--color-success-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-success-text)] tabular-nums">
            {formatElapsed(shift.started_at)}
          </span>
        </li>
      ))}
    </ul>
  )
}

function formatElapsed(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}ს ${m.toString().padStart(2, '0')}წ`
}
```

## Files to modify

### `apps/web/app/(app)/dashboard/page.tsx`
Replace the placeholder "active users" panel with `<LiveShiftsCard />`.
Server Component computes the initial list via SSR (existing pattern), then
hands it to the Client Component for live updates.

Add the SSR fetch alongside the existing `locations` fetch:

```ts
const { data: shiftRows } = await supabase
  .from('shifts')
  .select('id, user_id, started_at, user:users(first_name, last_name, email)')
  .eq('tenant_id', tenant.id)
  .eq('status', 'active')
  .order('started_at', { ascending: false })

const initialShifts: LiveShift[] = (shiftRows ?? []).map((row) => {
  const u = Array.isArray(row.user) ? row.user[0] : row.user
  const name = [u?.first_name, u?.last_name].filter(Boolean).join(' ') || u?.email || '—'
  return { id: row.id, user_id: row.user_id, user_name: name, started_at: row.started_at, location_name: null }
})
```

Then render `<LiveShiftsCard tenantId={tenant.id} initialShifts={initialShifts} />`
inside the existing right-hand card shell.

## Acceptance criteria
- [ ] On `/dashboard` an active shift inserted via the mobile path
      appears within ~2 seconds without refresh
- [ ] Closing a shift removes the row from the card live
- [ ] Initial SSR render has the shifts (works with JS disabled)
- [ ] Realtime channel name is tenant-scoped so two tenants don't see
      each other's updates (Supabase Realtime filtering)
- [ ] typecheck + format:check pass

## Commit
```powershell
git add apps/web/components/dashboard/LiveShiftsCard.tsx apps/web/app/\(app\)/dashboard/page.tsx
git commit -m "feat(dashboard): live shifts via supabase realtime"
```

## DO NOT
- ❌ Re-fetch the whole table on every event — already debounced by React
      batching but keep the query lean (no joins on the realtime path)
- ❌ Subscribe to `location_pings` here — that's a high-volume table and
      will eat the Realtime quota; admin team map already does that and is
      the right place
- ❌ Use `revalidatePath` — that defeats the point (full page reload).
      Stick to client-side state.
