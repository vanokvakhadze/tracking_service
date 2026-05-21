'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { reportServerActionError } from '@/lib/observability/report-error'
import { createClient } from '@/lib/supabase/server'

const ALERT_KINDS = ['mock_gps', 'location_disabled', 'low_battery', 'out_of_zone'] as const

const SettingSchema = z.object({
  alertKind: z.enum(ALERT_KINDS),
  pushEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  emailRecipients: z.array(z.string().email()).max(20),
})

const PayloadSchema = z.object({
  tenantId: z.string().uuid(),
  settings: z.array(SettingSchema).length(4),
})

export interface UpdateAlertSettingsResult {
  success?: true
  error?: string
}

export async function updateAlertSettings(payload: unknown): Promise<UpdateAlertSettingsResult> {
  const parsed = PayloadSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'არასწორი მონაცემები' }
  }

  const supabase = await createClient()
  const rows = parsed.data.settings.map((row) => ({
    tenant_id: parsed.data.tenantId,
    alert_kind: row.alertKind,
    push_enabled: row.pushEnabled,
    email_enabled: row.emailEnabled,
    email_recipients: row.emailRecipients,
  }))

  // Table added in migration 20260521000001. Drop the cast after the
  // migration is applied and `pnpm db:types` is re-run.
  // biome-ignore lint/suspicious/noExplicitAny: see comment above
  const { error } = await (supabase as any)
    .from('tenant_alert_settings')
    .upsert(rows, { onConflict: 'tenant_id,alert_kind' })

  if (error) {
    reportServerActionError(error, {
      action: 'update-alert-settings',
      tenantId: parsed.data.tenantId,
    })
    return { error: `შენახვა ვერ მოხერხდა: ${error.message}` }
  }

  revalidatePath('/settings')
  return { success: true }
}
