import { Feather } from '@expo/vector-icons'
import { Tabs } from 'expo-router'

const KAYA_ACCENT = '#1565C0'
const KAYA_TEXT_TERTIARY = '#94A3B8'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: KAYA_ACCENT,
        tabBarInactiveTintColor: KAYA_TEXT_TERTIARY,
        headerShown: false,
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E2E8F0' },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'მთავარი',
          tabBarIcon: ({ color }) => <Feather name="home" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'რუკა',
          tabBarIcon: ({ color }) => <Feather name="map" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'ისტორია',
          tabBarIcon: ({ color }) => <Feather name="clock" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'პროფილი',
          tabBarIcon: ({ color }) => <Feather name="user" color={color} size={22} />,
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  )
}
