import Constants from 'expo-constants'
import type { ComponentType } from 'react'

// react-native-maps requires native code that ships in a dev build but is
// missing from Expo Go (RNMapsAirModule unavailable → app crash on import).
// Pick the screen at module-load time so the heavy module is never imported
// in the Expo Go runtime. Wrap in a function default-export so Expo Router's
// static analyzer detects the route cleanly.

const isExpoGo = Constants.executionEnvironment === 'storeClient'

const ScreenModule = isExpoGo
  ? require('@/src/screens/employee/MapFallbackScreen')
  : require('@/src/screens/employee/MapNativeScreen')

const InnerScreen = ScreenModule.default as ComponentType

export default function MapTab() {
  return <InnerScreen />
}
