export type LocationCategory = 'office' | 'client_site' | 'warehouse' | 'checkpoint' | 'other'
export type LocationStatus = 'active' | 'pending_approval' | 'rejected' | 'archived'

export interface LocationRow {
  id: string
  name: string | null
  category: LocationCategory | null
  address: string | null
  latitude: number | null
  longitude: number | null
  radius_m: number
  boundary_radius_m: number | null
  is_active: boolean | null
  status: LocationStatus
  created_at: string | null
  analytics?: LocationAnalytics
}

export interface LocationTeamMember {
  id: string
  name: string
  email: string
}

export interface LocationAnalytics {
  visitsToday: number
  avgDwellMinutes: number
  occupancyPct: number | null
  team: LocationTeamMember[]
}

export interface LocationStats {
  total: number
  visitsToday: number
  avgDwellMinutes: number
  pending: number
}

export interface TopLocationRow {
  id: string
  name: string
  visitsToday: number
  avgDwellMinutes: number
}

export const categoryLabels: Record<LocationCategory, string> = {
  office: 'ოფისი',
  client_site: 'კლიენტი',
  warehouse: 'საწყობი',
  checkpoint: 'საკონტროლო',
  other: 'სხვა',
}

export const statusLabels: Record<LocationStatus, string> = {
  active: 'აქტიური',
  pending_approval: 'მოლოდინში',
  rejected: 'უარყოფილი',
  archived: 'არქივი',
}
