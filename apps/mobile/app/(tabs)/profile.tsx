import { Feather } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getCurrentUser, logout } from '@/src/services/auth'

const KAYA = {
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  accent: '#1565C0',
  accentTint: '#E3F2FD',
  error: '#DC2626',
  errorBg: '#FEF2F2',
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  tenant_admin: 'ადმინისტრატორი',
  manager: 'მენეჯერი',
  user: 'თანამშრომელი',
}

interface ProfileRow {
  email: string | null
  firstName: string | null
  lastName: string | null
  role: string | null
  tenantName: string | null
}

export default function ProfileTab() {
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }
      const memberships = (user.memberships ?? []) as Array<{
        role: string
        is_active: boolean | null
        tenant: { name: string } | { name: string }[] | null
      }>
      const active = memberships.find((m) => m.is_active)
      const tenant = Array.isArray(active?.tenant) ? active?.tenant[0] : active?.tenant
      setProfile({
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: active?.role ?? null,
        tenantName: tenant?.name ?? null,
      })
      setLoading(false)
    })
  }, [])

  const displayName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email
    : ''
  const initials =
    profile?.firstName?.[0]?.toUpperCase() ?? profile?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{loading ? 'იტვირთება…' : displayName}</Text>
        {profile?.role && (
          <Text style={styles.role}>{roleLabels[profile.role] ?? profile.role}</Text>
        )}
        {profile?.tenantName && <Text style={styles.tenant}>{profile.tenantName}</Text>}
      </View>

      <View style={styles.menu}>
        <MenuItem icon="mail" label="ემაილი" value={profile?.email ?? '—'} />
        <MenuItem icon="bell" label="შეტყობინებები" value="ჩართულია" />
        <MenuItem icon="help-circle" label="დახმარება" value="" />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()} activeOpacity={0.8}>
        <Feather name="log-out" size={16} color={KAYA.error} />
        <Text style={styles.logoutText}>გასვლა</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

function MenuItem({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Feather>['name']
  label: string
  value: string
}) {
  return (
    <View style={styles.menuItem}>
      <View style={styles.menuIcon}>
        <Feather name={icon} size={16} color={KAYA.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuLabel}>{label}</Text>
        {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      </View>
      <Feather name="chevron-right" size={16} color={KAYA.textTertiary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KAYA.surface, padding: 16 },
  header: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: KAYA.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: KAYA.accent },
  name: { fontSize: 18, fontWeight: '700', color: KAYA.textPrimary },
  role: { fontSize: 13, color: KAYA.textSecondary, marginTop: 2 },
  tenant: { fontSize: 12, color: KAYA.textTertiary, marginTop: 2 },

  menu: {
    backgroundColor: KAYA.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KAYA.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: KAYA.border,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: KAYA.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { fontSize: 13, fontWeight: '600', color: KAYA.textPrimary },
  menuValue: { fontSize: 11, color: KAYA.textTertiary, marginTop: 2 },

  logoutBtn: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: KAYA.errorBg,
    paddingVertical: 12,
    borderRadius: 10,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: KAYA.error },
})
