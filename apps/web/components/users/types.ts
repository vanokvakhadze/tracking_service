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
  team_name?: string | null
  visits_7d?: number
  productivity_score?: number
  activity_trend?: number[]
  user: MembershipUser | MembershipUser[] | null
}

export interface UsersStats {
  total: number
  active: number
  averageProductivity: number
  pendingInvites: number
}

export interface PendingInvitationRow {
  id: string
  email: string
  role: string
  created_at: string | null
  expires_at: string
  status: string | null
}

export const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  tenant_admin: 'ადმინისტრატორი',
  manager: 'მენეჯერი',
  user: 'თანამშრომელი',
}
