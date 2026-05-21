'use server'

import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/actions'
import { sendInviteEmail } from '@/lib/email/send-invite-email'
import { reportServerActionError } from '@/lib/observability/report-error'
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

function generateToken() {
  return randomBytes(32).toString('base64url')
}

export async function bulkInviteFromCsv(csv: string): Promise<BulkResult> {
  const me = await getCurrentUser()
  const membership = me?.memberships?.find((m) => m.is_active)

  if (!membership || !['tenant_admin', 'super_admin'].includes(membership.role)) {
    throw new Error('Only admins can bulk invite')
  }

  const tenantId = membership.tenant?.id
  if (!tenantId) throw new Error('No tenant')

  const rows = parseCsv(csv)
  if (rows.length > 200) {
    throw new Error('CSV too large. Split into chunks of 200 rows.')
  }

  const supabase = await createClient()
  const result: BulkResult = { ok: 0, skipped: 0, errors: [] }

  const expiresAtMs = Date.now() + 7 * 24 * 60 * 60 * 1000
  const expiresAt = new Date(expiresAtMs).toISOString()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const companyName = membership.tenant?.name ?? 'TrackPro'
  const inviterName = [me?.first_name, me?.last_name].filter(Boolean).join(' ').trim() || null
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  for (let index = 0; index < rows.length; index++) {
    const raw = rows[index]
    const parsed = RowSchema.safeParse({
      email: raw.email,
      first_name: raw.first_name,
      last_name: raw.last_name,
      role: raw.role || undefined,
      employee_code: raw.employee_code || undefined,
    })

    if (!parsed.success) {
      result.errors.push({
        row: index + 2,
        email: String(raw?.email ?? ''),
        reason: parsed.error.issues[0]?.message ?? 'invalid',
      })
      continue
    }

    const token = generateToken()
    const { error } = await supabase.from('invitations').insert({
      tenant_id: tenantId,
      email: parsed.data.email,
      role: parsed.data.role,
      token,
      expires_at: expiresAt,
      invited_by_user_id: authUser?.id ?? null,
    })

    if (error) {
      if (error.code === '23505') {
        result.skipped += 1
      } else {
        reportServerActionError(error, {
          action: 'bulk-invite-row',
          tenantId,
          userId: authUser?.id ?? null,
          extra: { email: parsed.data.email, role: parsed.data.role, row: index + 2 },
        })
        result.errors.push({ row: index + 2, email: parsed.data.email, reason: error.message })
      }
      continue
    }

    await sendInviteEmail({
      to: parsed.data.email,
      inviteUrl: `${appUrl}/accept-invite/${token}`,
      companyName,
      inviterName,
      role: parsed.data.role,
      expiresAt: new Date(expiresAtMs),
    })

    result.ok += 1
  }

  return result
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => line.trim().length > 0)

  if (lines.length === 0) return []

  const header = splitCsvLine(lines[0]).map((column) => column.trim().toLowerCase())

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line)
    const row: Record<string, string> = {}
    header.forEach((name, index) => {
      row[name] = (cells[index] ?? '').trim()
    })
    return row
  })
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }

  cells.push(current)
  return cells
}
