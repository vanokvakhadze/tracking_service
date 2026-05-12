export interface MembershipUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  last_login_at: string | null
}

export interface MembershipRow {
  id: string
  role: string
  is_active: boolean | null
  employee_code: string | null
  created_at: string | null
  user: MembershipUser | MembershipUser[] | null
}

export const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  tenant_admin: 'ადმინისტრატორი',
  manager: 'მენეჯერი',
  user: 'თანამშრომელი',
}
