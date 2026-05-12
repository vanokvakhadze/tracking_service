import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import { useAuth } from '@/src/hooks/use-auth'
import { useOnboarding } from '@/src/hooks/use-onboarding'

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

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={authedAndOnboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
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
