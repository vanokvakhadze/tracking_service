import { Feather } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { useMobileRole } from '@/src/hooks/use-mobile-role'

const KAYA_ACCENT = '#1565C0'
const KAYA_TEXT_TERTIARY = '#94A3B8'

export default function TabLayout() {
  const role = useMobileRole()
  const isAdmin = role === 'admin'

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
      {/* Employee home tab */}
      <Tabs.Screen
        name="index"
        options={{
          href: isAdmin ? null : '/',
          title: 'მთავარი',
          tabBarIcon: ({ color }) => <Feather name="home" color={color} size={22} />,
        }}
      />

      {/* Admin home tab */}
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          href: isAdmin ? '/admin-dashboard' : null,
          title: 'დაშბორდი',
          tabBarIcon: ({ color }) => <Feather name="grid" color={color} size={22} />,
        }}
      />

      {/* Map tab — visible to both; screen role-branches in task 4.3. */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'რუკა',
          tabBarIcon: ({ color }) => <Feather name="map" color={color} size={22} />,
        }}
      />

      {/* Employee tabs */}
      <Tabs.Screen
        name="history"
        options={{
          href: isAdmin ? null : '/history',
          title: 'ისტორია',
          tabBarIcon: ({ color }) => <Feather name="clock" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: isAdmin ? null : '/profile',
          title: 'პროფილი',
          tabBarIcon: ({ color }) => <Feather name="user" color={color} size={22} />,
        }}
      />

      {/* Admin tabs */}
      <Tabs.Screen
        name="admin-team"
        options={{
          href: isAdmin ? '/admin-team' : null,
          title: 'გუნდი',
          tabBarIcon: ({ color }) => <Feather name="users" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="admin-alerts"
        options={{
          href: isAdmin ? '/admin-alerts' : null,
          title: 'ალერტი',
          tabBarIcon: ({ color }) => <Feather name="alert-triangle" color={color} size={22} />,
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  )
}
