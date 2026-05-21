'use server'

import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { sendInviteEmail } from '@/lib/email/send-invite-email'
import { createClient } from '@/lib/supabase/server'

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['user', 'manager', 'tenant_admin']),
})

function generateToken() {
  // 32 random bytes → 43-char base64url
  return randomBytes(32).toString('base64url')
}

export async function inviteUser(formData: FormData) {
  const parsed = InviteSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
  })

  if (!parsed.success) return { error: 'არასწორი მონაცემები' }

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return { error: 'Unauthorized' }

  // Look up the inviter's active admin membership to discover their tenant_id.
  // RLS on tenant_memberships isolates by tenant — same logic as our invitation
  // RLS policies, so this is safe even though tenant_memberships also has RLS.
  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('tenant_id, role')
    .eq('user_id', authUser.id)
    .eq('is_active', true)
    .in('role', ['tenant_admin', 'super_admin'])
    .limit(1)
    .single()

  if (!membership) return { error: 'მხოლოდ admin-ი იწვევს მომხმარებლებს' }

  const token = generateToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const { error: insertError } = await supabase.from('invitations').insert({
    tenant_id: membership.tenant_id,
    email: parsed.data.email,
    role: parsed.data.role,
    token,
    expires_at: expiresAt.toISOString(),
    invited_by_user_id: authUser.id,
  })

  if (insertError) {
    return { error: 'მოწვევა ვერ შეიქმნა' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteUrl = `${appUrl}/accept-invite/${token}`

  const [{ data: tenant }, { data: inviter }] = await Promise.all([
    supabase.from('tenants').select('name').eq('id', membership.tenant_id).single(),
    supabase.from('users').select('first_name, last_name').eq('id', authUser.id).single(),
  ])

  const inviterName =
    [inviter?.first_name, inviter?.last_name].filter(Boolean).join(' ').trim() || null

  const emailResult = await sendInviteEmail({
    to: parsed.data.email,
    inviteUrl,
    companyName: tenant?.name ?? 'TrackPro',
    inviterName,
    role: parsed.data.role,
    expiresAt,
  })

  return { success: true, inviteUrl, emailSent: emailResult.sent }
}
