import Constants from 'expo-constants'
import type { ComponentType } from 'react'

// react-native-maps requires native code that ships in a dev build but is
// missing from Expo Go (RNMapsAirModule unavailable → app crash on import).
// Pick the screen at module-load time so the heavy module is never imported
// in the Expo Go runtime.

const isExpoGo = Constants.executionEnvironment === 'storeClient'

let Screen: ComponentType
if (isExpoGo) {
  Screen = require('@/src/screens/employee/MapFallbackScreen').default as ComponentType
} else {
  Screen = require('@/src/screens/employee/MapNativeScreen').default as ComponentType
}

export default Screen
