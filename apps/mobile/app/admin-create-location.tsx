import Constants from 'expo-constants'
import type { ComponentType } from 'react'

const isExpoGo = Constants.executionEnvironment === 'storeClient'

const ScreenModule = isExpoGo
  ? require('@/src/screens/admin/CreateLocationMapFallbackScreen')
  : require('@/src/screens/admin/CreateLocationMapScreen')

const Screen = ScreenModule.default as ComponentType

export default function AdminCreateLocationRoute() {
  return <Screen />
}
