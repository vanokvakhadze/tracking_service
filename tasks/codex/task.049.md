# task.049 — Bulk user import via CSV

**Type:** 🤖 Codex
**Phase:** 8 — Post-MVP polish (Beta-launch enabler)
**Depends on:** Existing /users page + invite flow
**Commit:** `feat(users): bulk invite via csv upload`

---

## Read first
- `tasks/00_HANDOFF.md`
- `apps/web/app/(app)/users/page.tsx`
- `apps/web/app/(app)/users/invite-action.ts` — single-invite server action

## Goal
Beta customers will have 10–50 employees on day one. The current one-at-a-time
invite flow doesn't scale — they'll churn. Add a CSV upload that batch-invites
20–50 emails in one go.

CSV shape:

```csv
email,first_name,last_name,role,employee_code
giorgi@example.com,Giorgi,Beridze,user,EMP001
nini@example.com,Nini,Chich,user,EMP002
admin@example.com,Demo,Admin,tenant_admin,
```

## Files to add

### `apps/web/app/(app)/users/bulk-invite-action.ts`
```ts
'use server'

import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

const RowSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  role: z.enum(['user', 'tenant_admin']).default('user'),
  employee_code: z.string().max(50).optional(),
})

interface BulkResult {
  ok: number
  skipped: number
  errors: { row: number; email: string; reason: string }[]
}

export async function bulkInviteFromCsv(csv: string): Promise<BulkResult> {
  const me = await getCurrentUser()
  const membership = me?.memberships?.find((m) => m.is_active)
  if (!membership || !['tenant_admin', 'super_admin'].includes(membership.role)) {
    throw new Error('Only admins can bulk invite')
  }
  const tenantId = membership.tenant?.id
  if (!tenantId) throw new Error('No tenant')

  const rows = parseCsv(csv) // see helper below

  const supabase = await createClient()
  const result: BulkResult = { ok: 0, skipped: 0, errors: [] }

  for (let i = 0; i < rows.length; i++) {
    const parsed = RowSchema.safeParse(rows[i])
    if (!parsed.success) {
      result.errors.push({
        row: i + 2, // 1-indexed + header
        email: String(rows[i]?.email ?? ''),
        reason: parsed.error.issues[0]?.message ?? 'invalid',
      })
      continue
    }

    // Upsert into invitations — RLS gates tenant scope
    const { error } = await supabase.from('invitations').insert({
      tenant_id: tenantId,
      email: parsed.data.email,
      role: parsed.data.role,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      employee_code: parsed.data.employee_code ?? null,
    })

    if (error) {
      if (error.code === '23505') {
        result.skipped += 1 // already invited; skip silently
      } else {
        result.errors.push({ row: i + 2, email: parsed.data.email, reason: error.message })
      }
      continue
    }
    result.ok += 1
  }

  return result
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []
  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line)
    const row: Record<string, string> = {}
    header.forEach((h, i) => {
      row[h] = (cells[i] ?? '').trim()
    })
    return row
  })
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // skip escaped quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (c === ',' && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += c
    }
  }
  cells.push(current)
  return cells
}
```

### `apps/web/components/users/BulkInviteDialog.tsx`
- Client Component with a Dialog
- File input (accepts `.csv`)
- Reads file as text via FileReader API
- Posts to `bulkInviteFromCsv` server action
- Shows result counts + per-row error list
- "ჩამოტვირთე template" button → triggers a download of `template.csv` with the header row + 2 example rows

## Files to modify

### `apps/web/app/(app)/users/page.tsx`
Add `<BulkInviteDialog />` to the header next to the existing "+ თანამშრომელი"
button. Both buttons coexist — single invite remains for the common case.

## Acceptance criteria
- [ ] 50-row CSV import works inside the 60s Server Action timeout (or surface
      a "split into chunks" message if larger)
- [ ] Bad rows surface in the result modal with line numbers
- [ ] Duplicate emails are silently skipped (not errors)
- [ ] Only `tenant_admin` + `super_admin` can call the action — server-side
      guard, not just UI
- [ ] Downloadable template hits the right schema
- [ ] typecheck + format:check pass

## Commit
```powershell
git add apps/web/app/\(app\)/users/bulk-invite-action.ts apps/web/components/users/BulkInviteDialog.tsx apps/web/app/\(app\)/users/page.tsx
git commit -m "feat(users): bulk invite via csv upload"
```

## DO NOT
- ❌ Send actual invite emails from the action — `invitations` table insert
      already triggers the email via a Supabase trigger / Resend integration
      (or will). Don't double-send.
- ❌ Parse with a third-party library — the lightweight reader above handles
      99% of cases; adding `papaparse` is overkill for one screen.
- ❌ Drop the existing single-invite flow — it stays as the primary path for
      one-off invites.
