'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function loginWithPassword(formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: 'არასწორი ფორმატი' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: 'არასწორი ემაილი ან პაროლი' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function sendMagicLink(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/callback`,
    },
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  const { data: profile, error } = await supabase
    .from('users')
    .select(
      `
      id,
      email,
      first_name,
      last_name,
      avatar_url,
      is_super_admin,
      memberships:tenant_memberships(
        id,
        role,
        is_active,
        employee_code,
        tenant:tenants(id, name, subdomain, status, default_language)
      )
    `,
    )
    .eq('id', authUser.id)
    .single()

  if (error || !profile) return null

  return profile
}
