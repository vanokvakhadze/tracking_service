import { Feather } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAdminSnapshot } from '@/src/hooks/use-admin-snapshot'
import type { AdminShift } from '@/src/services/admin-dashboard'

const KAYA = {
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  accent: '#1565C0',
  accentFg: '#FFFFFF',
  accentTint: '#E3F2FD',
  success: '#16A34A',
}

const AVATAR_TONES = [
  { bg: '#E3F2FD', text: '#1565C0' },
  { bg: '#F0FDF4', text: '#15803D' },
  { bg: '#FEFCE8', text: '#A16207' },
  { bg: '#FEF2F2', text: '#B91C1C' },
]

export default function AdminDashboard() {
  const { snapshot, loading, refreshing, refresh } = useAdminSnapshot()
  const [tick, setTick] = useState(0)
  const activeShifts = snapshot?.activeShifts ?? []
  const totalMembers = snapshot?.totalMembers ?? 0

  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={activeShifts}
        extraData={tick}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ShiftRow shift={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>დაშბორდი</Text>
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>ცოცხალი სტატუსი</Text>
              <Text style={styles.heroValue}>
                {activeShifts.length} / {totalMembers} active
              </Text>
              <Text style={styles.heroSub}>{todayLabel()}</Text>
            </View>
            <Text style={styles.sectionTitle}>ცოცხალი ცვლა</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name={loading ? 'loader' : 'users'} size={24} color={KAYA.textTertiary} />
            <Text style={styles.emptyTitle}>
              {loading ? 'იტვირთება…' : 'ცვლები არ მიმდინარეობს'}
            </Text>
            {!loading && (
              <Text style={styles.emptyText}>
                ცვლები არ მიმდინარეობს. Phase 3 SDK-ის ჩართვის შემდეგ აქ გამოჩნდება ცოცხალი
                მონაცემები.
              </Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  )
}

function ShiftRow({ shift }: { shift: AdminShift }) {
  const displayName = getDisplayName(shift)
  const tone = AVATAR_TONES[hashString(shift.user_id) % AVATAR_TONES.length]

  return (
    <View style={styles.shiftRow}>
      <View style={[styles.avatar, { backgroundColor: tone.bg }]}>
        <Text style={[styles.avatarText, { color: tone.text }]}>{initials(displayName)}</Text>
      </View>
      <View style={styles.shiftBody}>
        <Text style={styles.shiftName}>{displayName}</Text>
        <Text style={styles.shiftLocation}>{shift.location_name || 'ლოკაცია უცნობია'}</Text>
      </View>
      <View style={styles.elapsedPill}>
        <View style={styles.liveDot} />
        <Text style={styles.elapsedText}>{formatElapsed(shift.started_at)}</Text>
      </View>
    </View>
  )
}

function getDisplayName(shift: AdminShift) {
  return [shift.user_first_name, shift.user_last_name].filter(Boolean).join(' ') || shift.user_email
}

function initials(value: string) {
  return (
    value
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase())
      .filter(Boolean)
      .slice(0, 2)
      .join('') || '?'
  )
}

function formatElapsed(startedAt: string) {
  const totalMinutes = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}ს ${minutes.toString().padStart(2, '0')}წ`
}

function todayLabel() {
  return new Date().toLocaleDateString('ka-GE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function hashString(value: string) {
  return [...value].reduce((hash, char) => hash + char.charCodeAt(0), 0)
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KAYA.surface },
  list: { padding: 16, gap: 12, paddingBottom: 28 },
  header: { gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: KAYA.textPrimary },

  hero: {
    backgroundColor: KAYA.accent,
    borderRadius: 18,
    padding: 22,
    overflow: 'hidden',
  },
  heroLabel: { color: KAYA.accentTint, fontSize: 13, fontWeight: '600' },
  heroValue: {
    color: KAYA.accentFg,
    fontSize: 36,
    fontWeight: '700',
    marginTop: 14,
    fontVariant: ['tabular-nums'],
  },
  heroSub: { color: KAYA.accentTint, fontSize: 12, marginTop: 6 },
  sectionTitle: { color: KAYA.textPrimary, fontSize: 22, fontWeight: '700', marginTop: 12 },

  shiftRow: {
    backgroundColor: KAYA.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KAYA.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  shiftBody: { flex: 1, minWidth: 0 },
  shiftName: { fontSize: 15, fontWeight: '700', color: KAYA.textPrimary },
  shiftLocation: { fontSize: 12, color: KAYA.textSecondary, marginTop: 3 },
  elapsedPill: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: KAYA.success },
  elapsedText: {
    fontSize: 13,
    fontWeight: '700',
    color: KAYA.success,
    fontVariant: ['tabular-nums'],
  },

  empty: {
    backgroundColor: KAYA.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KAYA.border,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: KAYA.textPrimary },
  emptyText: { fontSize: 12, lineHeight: 18, color: KAYA.textSecondary, textAlign: 'center' },
})
