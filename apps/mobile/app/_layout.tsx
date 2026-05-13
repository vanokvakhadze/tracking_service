import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import { useAuth } from '@/src/hooks/use-auth'
import { useOnboarding } from '@/src/hooks/use-onboarding'
import { useTrackingBootstrap } from '@/src/hooks/use-tracking-bootstrap'

export const unstable_settings = {
  anchor: '(tabs)',
}

export default function RootLayout() {
  const { session, loading } = useAuth()
  const onboarded = useOnboarding((s) => s.onboarded)

  if (loading) return null

  const authed = Boolean(session)
  const authedAndOnboarded = authed && onboarded
  const authedNeedsOnboarding = authed && !onboarded

  useTrackingBootstrap(authedAndOnboarded)

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={authedAndOnboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="mark" options={{ presentation: 'modal', title: 'მონიშვნა' }} />
          <Stack.Screen
            name="admin-create-location"
            options={{ presentation: 'modal', title: 'ლოკაცია' }}
          />
          <Stack.Screen
            name="admin-location-form"
            options={{ presentation: 'modal', title: 'ლოკაცია — დეტალები' }}
          />
          <Stack.Screen
            name="work-zone/[id]"
            options={{ presentation: 'modal', title: 'სამუშაო ზონა' }}
          />
          <Stack.Screen
            name="approve-location/index"
            options={{ presentation: 'modal', title: 'მოლოდინში' }}
          />
          <Stack.Screen name="approve-location/[id]" options={{ title: 'მოთხოვნის განხილვა' }} />
        </Stack.Protected>
        <Stack.Protected guard={authedNeedsOnboarding}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="permissions" />
        </Stack.Protected>
        <Stack.Protected guard={!authed}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}
