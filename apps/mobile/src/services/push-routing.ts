import { router } from 'expo-router'

interface PushData {
  kind?: string
  shift_id?: string
  location_id?: string
  user_id?: string
}

/** Returns the path to navigate to, or null when the kind is unknown. */
export function routeForPushData(data: PushData | null | undefined): string | null {
  if (!data?.kind) return null

  switch (data.kind) {
    case 'shift_started':
    case 'shift_ended':
      return '/'
    case 'approaching':
      return '/map'
    case 'out_of_zone':
    case 'mock_gps':
      return '/admin-alerts'
    default:
      return null
  }
}

/** Side-effect helper for the listener - kept separate so it's unit-testable. */
export function navigateFromPush(data: PushData | null | undefined): void {
  const path = routeForPushData(data)
  if (path) router.push(path as never)
}
