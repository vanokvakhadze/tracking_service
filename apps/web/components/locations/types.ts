export type LocationCategory = 'office' | 'client_site' | 'warehouse' | 'checkpoint' | 'other'

export interface LocationRow {
  id: string
  name: string
  category: LocationCategory | null
  address: string | null
  latitude: number | null
  longitude: number | null
  radius_m: number
  is_active: boolean | null
  created_at: string | null
}

export const categoryLabels: Record<LocationCategory, string> = {
  office: 'ოფისი',
  client_site: 'კლიენტი',
  warehouse: 'საწყობი',
  checkpoint: 'საკონტროლო',
  other: 'სხვა',
}
