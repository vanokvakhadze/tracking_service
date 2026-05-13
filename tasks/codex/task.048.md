# task.048 — Reports CSV export (web admin)

**Type:** 🤖 Codex
**Phase:** 7 — Polish
**Depends on:** Existing /reports page
**Commit:** `feat(reports): csv export of shift records`

---

## Read first
- `tasks/00_HANDOFF.md`
- `apps/web/app/(app)/reports/page.tsx` — existing reports surface
- Database types: `packages/database/src/types.ts` — `shifts` Row shape

## Goal
Add a `+ ექსპორტი (CSV)` button on `/reports` that downloads a CSV of the
admin's tenant shifts for the visible date range. Finance teams use this
weekly — even a basic CSV unblocks 80% of the value of the page.

## Files to add

### `apps/web/app/(app)/reports/export-action.ts`
```ts
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
}

export async function exportShiftsCsv(input: ExportInput): Promise<string> {
  const me = await getCurrentUser()
  const tenantId = me?.memberships?.find((m) => m.is_active)?.tenant?.id
  if (!tenantId) throw new Error('Not in a tenant')

  const supabase = await createClient()
  let q = supabase
    .from('shifts')
    .select(
      'id, started_at, ended_at, status, user:users(first_name, last_name, email)',
    )
    .eq('tenant_id', tenantId)
    .order('started_at', { ascending: false })
    .limit(5000)

  if (input.fromIso) q = q.gte('started_at', input.fromIso)
  if (input.toIso) q = q.lte('started_at', input.toIso)

  const { data, error } = await q
  if (error) throw new Error(error.message)

  const rows: ExportRow[] = (data ?? []).map((row) => {
    const u = Array.isArray(row.user) ? row.user[0] : row.user
    const name = [u?.first_name, u?.last_name].filter(Boolean).join(' ') || ''
    const minutes = row.ended_at
      ? Math.round((new Date(row.ended_at).getTime() - new Date(row.started_at).getTime()) / 60000)
      : 0
    return {
      shift_id: row.id,
      user_name: name,
      user_email: u?.email ?? '',
      started_at: row.started_at,
      ended_at: row.ended_at,
      total_minutes: minutes,
      status: row.status,
    }
  })

  return toCsv(rows)
}

function toCsv(rows: ExportRow[]): string {
  const header = ['shift_id', 'user_name', 'user_email', 'started_at', 'ended_at', 'total_minutes', 'status']
  const escape = (value: string | number | null) => {
    if (value === null || value === undefined) return ''
    const s = String(value)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
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
      ]
        .map(escape)
        .join(','),
    )
  }
  return lines.join('\n')
}
```

### `apps/web/components/reports/ExportButton.tsx`
```tsx
'use client'

import { Download } from 'lucide-react'
import { useState, useTransition } from 'react'
import { exportShiftsCsv } from '@/app/(app)/reports/export-action'
import { Button } from '@/components/ui/Button'

interface Props {
  fromIso?: string
  toIso?: string
}

export function ExportButton({ fromIso, toIso }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    setError(null)
    startTransition(async () => {
      try {
        const csv = await exportShiftsCsv({ fromIso, toIso })
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `trackpro-shifts-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <div className="inline-flex flex-col items-end">
      <Button onClick={handleClick} loading={pending} variant="secondary">
        <Download className="h-3.5 w-3.5" />
        ექსპორტი (CSV)
      </Button>
      {error && <p className="mt-1 text-[11px] text-[var(--color-error-text)]">{error}</p>}
    </div>
  )
}
```

## Files to modify

### `apps/web/app/(app)/reports/page.tsx`
Add `<ExportButton />` to the page header (right side). If the reports page
already has from/to date filters, pass them through; otherwise wire it up
without args (server action falls back to "last 5000 shifts").

## Acceptance criteria
- [ ] Button appears on `/reports`
- [ ] Click downloads a CSV named `trackpro-shifts-YYYY-MM-DD.csv`
- [ ] CSV opens cleanly in Excel + Google Sheets (UTF-8, escaped quotes)
- [ ] Only the caller's tenant rows are included (RLS already gates this)
- [ ] Empty result still produces a valid CSV with just the header line
- [ ] typecheck + format:check pass

## Commit
```powershell
git add apps/web/app/\(app\)/reports/export-action.ts apps/web/components/reports/ExportButton.tsx apps/web/app/\(app\)/reports/page.tsx
git commit -m "feat(reports): csv export of shift records"
```

## DO NOT
- ❌ Stream the CSV from the server — the dataset is small (5k row cap),
      simpler to render as a single string and Blob-download on the client
- ❌ Include `coords` columns — PostGIS WKT in a CSV is ugly and finance
      doesn't need it. Stick to the columns above.
- ❌ Skip RLS by using the service-role client — the regular Server Action
      client already filters to the caller's tenant via RLS, that's the
      whole point.
