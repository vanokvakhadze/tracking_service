import { supabase } from './supabase'

export async function loginWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getCurrentUser() {
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

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}
