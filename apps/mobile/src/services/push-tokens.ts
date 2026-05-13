import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { supabase } from './supabase'

const isExpoGo = Constants.executionEnvironment === 'storeClient'

/**
 * Acquire an Expo push token and upsert it into user_devices.
 * No-op in Expo Go SDK 53+ (push tokens require a dev build).
 *
 * Call from app boot AFTER auth + onboarding so we don't ask the user
 * for notification permissions before they've seen the value proposition.
 */
export async function registerPushToken(): Promise<void> {
  if (isExpoGo) return

  // Lazy-require so the static import doesn't crash Expo Go (which we
  // already early-returned from). Same trick the onboarding screen uses.
  const Notifications = require('expo-notifications') as typeof import('expo-notifications')

  const settings = await Notifications.getPermissionsAsync()
  if (settings.status !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return
  }

  // EAS projectId is needed for Expo's push service to attribute the token.
  // It is exposed at runtime via expo-constants.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined
  if (!projectId) {
    console.warn('[push-tokens] no EAS projectId, skipping push registration')
    return
  }

  let token: string
  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId })
    token = result.data
  } catch (err) {
    console.error('[push-tokens] getExpoPushTokenAsync failed', err)
    return
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('user_devices').upsert(
    {
      user_id: user.id,
      expo_push_token: token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      app_version: Constants.expoConfig?.version ?? null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,expo_push_token' },
  )
}
