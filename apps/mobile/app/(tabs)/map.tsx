import Constants from 'expo-constants'
import type { ComponentType } from 'react'
import { useMobileRole } from '@/src/hooks/use-mobile-role'

const isExpoGo = Constants.executionEnvironment === 'storeClient'

const adminNative = () => require('@/src/screens/admin/TeamMapScreen').default
const adminFallback = () => require('@/src/screens/admin/TeamMapFallbackScreen').default
const employeeNative = () => require('@/src/screens/employee/MapNativeScreen').default
const employeeFallback = () => require('@/src/screens/employee/MapFallbackScreen').default

export default function MapTab() {
  const role = useMobileRole()
  let Screen: ComponentType
  if (role === 'admin') {
    Screen = isExpoGo ? adminFallback() : adminNative()
  } else {
    Screen = isExpoGo ? employeeFallback() : employeeNative()
  }
  return <Screen />
}
