export type TrackerStatus = 'active' | 'idle' | 'off'

export interface TrackerVM {
  id: string
  user_id: string
  name: string
  initials: string
  team: string
  status: TrackerStatus
  startedAt: string
  timeLabel: string
  lat: number | null
  lng: number | null
  batteryPercent: number | null
  accuracyM: number | null
  speedMps: number | null
  avatarBg: string
  avatarFg: string
}

export interface TimelineEvent {
  id: string
  shift_id: string | null
  user_id: string
  kind: 'enter' | 'exit'
  locationName: string | null
  occurredAt: string
}

export interface LiveMapLocation {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  radius_m: number
  is_active: boolean | null
}

const AVATAR_PALETTE: Array<[string, string]> = [
  ['#FEF3C7', '#B45309'],
  ['#FCE7F3', '#9D174D'],
  ['#DCFCE7', '#166534'],
  ['#DBEAFE', '#1E40AF'],
  ['#FEE2E2', '#991B1B'],
  ['#E0E7FF', '#3730A3'],
  ['#FED7AA', '#9A3412'],
  ['#CFFAFE', '#155E75'],
  ['#FDF4FF', '#86198F'],
]

export function pickAvatarColors(userId: string): { bg: string; fg: string } {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  const [bg, fg] = AVATAR_PALETTE[hash % AVATAR_PALETTE.length]!
  return { bg, fg }
}

export function initialsOf(
  firstName: string | null,
  lastName: string | null,
  email: string | null,
) {
  const parts = [firstName, lastName].filter(Boolean) as string[]
  if (parts.length === 0 && email) return email[0]!.toUpperCase()
  return (
    parts
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2) || '?'
  )
}

export function elapsedLabel(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} წთ`
  return `${hours}ს ${rest.toString().padStart(2, '0')}წ`
}

export function relativeLabel(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 1) return 'ახლა'
  if (minutes < 60) return `${minutes} წთ წინ`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} საათის წინ`
  const days = Math.floor(hours / 24)
  return `${days} დღის წინ`
}
