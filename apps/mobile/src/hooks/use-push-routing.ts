import Constants from 'expo-constants'
import { useEffect } from 'react'
import { navigateFromPush } from '@/src/services/push-routing'

const isExpoGo = Constants.executionEnvironment === 'storeClient'

export function usePushRouting(enabled: boolean) {
  useEffect(() => {
    if (!enabled || isExpoGo) return

    const Notifications = require('expo-notifications') as typeof import('expo-notifications')

    // 1) Cold start: user tapped push while app was killed.
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      navigateFromPush(response?.notification?.request?.content?.data)
    })

    // 2) Warm start: user tapped push while app was in background.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateFromPush(response.notification.request.content.data)
    })

    return () => sub.remove()
  }, [enabled])
}
