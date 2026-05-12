'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const AcceptSchema = z.object({
  token: z.string().min(10),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8),
})

export async function acceptInviteAction(formData: FormData) {
  const parsed = AcceptSchema.safeParse({
    token: formData.get('token'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    password: formData.get('password'),
  })

  if (!parsed.success) return { error: 'შეავსე ყველა ველი სწორად' }

  const supabase = await createClient()

  // Re-read the invitation to get the email + verify it is still valid.
  const { data: invitation } = await supabase
    .from('invitations')
    .select('email')
    .eq('token', parsed.data.token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invitation) return { error: 'მოწვევა აღარ არის მოქმედი' }

  // 1) Create the Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: invitation.email,
    password: parsed.data.password,
  })

  if (authError || !authData.user) {
    return { error: authError?.message ?? 'რეგისტრაცია ვერ მოხერხდა' }
  }

  // 2) Run the RPC that creates the profile + membership + marks accepted
  // @ts-expect-error — accept_invitation lands in generated types after the
  // migration in supabase/migrations/20260512000002 is applied + db:types regen
  const { error: rpcError } = await supabase.rpc('accept_invitation', {
    p_token: parsed.data.token,
    p_user_id: authData.user.id,
    p_first_name: parsed.data.firstName,
    p_last_name: parsed.data.lastName,
  })

  if (rpcError) {
    return { error: 'მოწვევის გააქტიურება ვერ მოხერხდა — სცადე ხელახლა' }
  }

  redirect('/dashboard')
}
