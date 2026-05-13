# task.050 — Shift annotations (admin notes on completed shifts)

**Type:** 🤖 Codex
**Phase:** 8 — Post-MVP polish
**Depends on:** Existing /reports page + shifts table
**Commit:** `feat(reports): admin annotations on completed shifts`

---

## Read first
- `tasks/00_HANDOFF.md`
- `apps/web/app/(app)/reports/page.tsx` — placeholder, very thin today
- Database types: `packages/database/src/types.ts` — `shifts.notes text` already exists in the Row shape

## Goal
Auto-tracked shifts are great until finance asks "why is this shift only 4
hours when it should be 8?". Admins need a way to add a one-liner annotation
to a shift after the fact — e.g. "lunch at client site, manually verified",
or "GPS dropped between 12:30–13:15, payroll-approved 30min adjustment".

The `shifts.notes` column already exists. We just need a UI surface +
server action that's RLS-safe.

## Files to add

### Migration `supabase/migrations/<next>_shift_annotations.sql`

Add a `shifts_admin_update_notes` RLS policy so admins can `UPDATE` the
notes column on shifts in their own tenant. Restrict the UPDATE to ONLY
the `notes` column via a column-level grant. Today's `shifts` policies
only allow SELECT, never UPDATE.

```sql
-- Allow tenant admins to annotate shifts in their tenant.
drop policy if exists shifts_admin_update_notes on public.shifts;
create policy shifts_admin_update_notes on public.shifts
  for update
  to authenticated
  using (public.is_tenant_admin(tenant_id))
  with check (public.is_tenant_admin(tenant_id));

-- Column-level scope: only `notes` + `updated_at` are write-allowed by
-- admins. Other columns remain immutable from REST.
revoke update on public.shifts from authenticated;
grant update (notes, updated_at) on public.shifts to authenticated;
```

### `apps/web/app/(app)/reports/annotate-action.ts`
```ts
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

const Schema = z.object({
  shiftId: z.string().uuid(),
  notes: z.string().max(500), // empty string clears the note
})

export async function annotateShift(input: z.infer<typeof Schema>) {
  const parsed = Schema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'invalid' }

  const me = await getCurrentUser()
  const membership = me?.memberships?.find((m) => m.is_active)
  if (!membership || !['tenant_admin', 'super_admin'].includes(membership.role)) {
    return { error: 'forbidden' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('shifts')
    .update({ notes: parsed.data.notes || null, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.shiftId)

  if (error) return { error: error.message }
  revalidatePath('/reports')
  return { ok: true }
}
```

### `apps/web/components/reports/AnnotateShiftDialog.tsx`
- Client Component with a Dialog (use existing `components/ui/Dialog.tsx`)
- `notes` textarea (500 char count)
- `Save` calls the action; toast/banner on error

### `apps/web/components/reports/ShiftsTable.tsx`
- Server Component that fetches the tenant's recent shifts (last 30 days, cap 200)
- Renders a table: user · started · ended · total minutes · notes · "✏ ანოტაცია" button
- Notes are truncated to one line with `title={notes}` for the full text

## Files to modify

### `apps/web/app/(app)/reports/page.tsx`
Replace the existing placeholder metric cards with `<ShiftsTable />` below
them. Keep the existing ExportButton — CSV should include the notes column
(amend task.048's export-action.ts to add `notes` to ExportRow).

## Acceptance criteria
- [ ] Admin can save / edit / clear a note on any shift in their tenant
- [ ] Employee cannot edit notes (RLS blocks; UI doesn't even render the button)
- [ ] CSV export includes notes column
- [ ] After save, the table refreshes (revalidatePath) — no stale data
- [ ] typecheck + format:check pass

## Commit
```powershell
git add supabase/migrations apps/web/app/\(app\)/reports apps/web/components/reports
git commit -m "feat(reports): admin annotations on completed shifts"
```

## DO NOT
- ❌ Open the door for column-mutation drift — keep the `grant update (notes, updated_at)`
      narrow. If you need to allow more columns later, add them explicitly.
- ❌ Use the service-role client — RLS via the regular Server Action client
      is the authority. Service role bypass is for cross-tenant work only.
- ❌ Skip the `revalidatePath` — without it the admin sees their old note
      until they hard-refresh, which is a confusing UX.
