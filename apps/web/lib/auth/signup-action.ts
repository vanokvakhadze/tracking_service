'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const SignupSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(2),
  subdomain: z
    .string()
    .regex(/^[a-z0-9-]{3,30}$/, 'subdomain უნდა იყოს 3-30 პატარა ასო/ციფრი/ტირე'),
})

function splitName(full: string): { first: string; last: string } {
  const trimmed = full.trim()
  const spaceAt = trimmed.indexOf(' ')
  if (spaceAt === -1) return { first: trimmed, last: '' }
  return {
    first: trimmed.slice(0, spaceAt),
    last: trimmed.slice(spaceAt + 1).trim(),
  }
}

export async function signupCompany(formData: FormData) {
  const parsed = SignupSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    companyName: formData.get('companyName'),
    subdomain: formData.get('subdomain'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'შეავსე ყველა ველი სწორად' }
  }

  const supabase = await createClient()

  // 1. Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (authError || !authData.user) {
    return { error: authError?.message ?? 'რეგისტრაცია ვერ მოხერხდა' }
  }

  // 2. Create tenant + user profile + tenant_admin membership
  const { first, last } = splitName(parsed.data.fullName)
  const { error: rpcError } = await supabase.rpc('create_tenant_with_admin', {
    p_user_id: authData.user.id,
    p_email: parsed.data.email,
    p_first_name: first,
    p_last_name: last,
    p_company_name: parsed.data.companyName,
    p_subdomain: parsed.data.subdomain,
  })

  if (rpcError) {
    const isSubdomainConflict =
      rpcError.code === '23505' || rpcError.message?.toLowerCase().includes('subdomain')
    return {
      error: isSubdomainConflict
        ? 'subdomain უკვე გამოყენებულია'
        : 'workspace ვერ შეიქმნა — სცადე ხელახლა',
    }
  }

  redirect('/dashboard')
}
