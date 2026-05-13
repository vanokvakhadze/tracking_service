import { Feather } from '@expo/vector-icons'
import { useCallback, useEffect, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/src/services/supabase'
import {
  fetchTeamPositions,
  type TeamPosition,
  type TeamStatus,
} from '@/src/services/team-positions'

const KAYA = {
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  warningBg: '#FEFCE8',
  warningText: '#A16207',
}

const STATUS_TONES: Record<TeamStatus, { bg: string; color: string }> = {
  active: { bg: '#E3F2FD', color: '#1565C0' },
  alert: { bg: '#FEF2F2', color: '#DC2626' },
  warning: { bg: '#FEFCE8', color: '#CA8A04' },
  offline: { bg: '#F1F5F9', color: '#94A3B8' },
}

export default function TeamMapFallbackScreen() {
  const [positions, setPositions] = useState<TeamPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    const rows = await fetchTeamPositions()
    setPositions(rows)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const channel = supabase
      .channel('admin-team-pings-fallback')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'location_pings' },
        () => {
          void load()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [load])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={positions}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item }) => <TeamRow position={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>ცოცხალი რუკა</Text>
            <Text style={styles.subtitle}>გუნდის ბოლო მდებარეობები</Text>
            <View style={styles.notice}>
              <Feather name="info" size={16} color={KAYA.warningText} />
              <Text style={styles.noticeText}>
                ვიზუალური რუკა Expo Go-ში არ მუშაობს. ახლა გუნდი სიად ჩანს; რეალური რუკა Development
                Build-ში ჩაირთვება.
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name={loading ? 'loader' : 'users'} size={24} color={KAYA.textTertiary} />
            <Text style={styles.emptyTitle}>
              {loading ? 'იტვირთება…' : 'გუნდის მდებარეობები ჯერ არ ჩანს'}
            </Text>
            {!loading ? (
              <Text style={styles.emptyText}>
                თანამშრომლის პირველი ping-ის შემდეგ ის ამ სიაში გამოჩნდება.
              </Text>
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  )
}

function TeamRow({ position }: { position: TeamPosition }) {
  const tone = STATUS_TONES[position.status]
  return (
    <View style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: tone.bg }]}>
        <Text style={[styles.avatarText, { color: tone.color }]}>{position.user_initials}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name}>{position.user_name}</Text>
        <Text style={styles.meta}>{relativeTime(position.recorded_at)}</Text>
        <Text style={styles.coords}>
          {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: tone.bg }]}>
        <Text style={[styles.badgeText, { color: tone.color }]}>
          {statusLabel(position.status)}
        </Text>
      </View>
    </View>
  )
}

function statusLabel(status: TeamStatus) {
  if (status === 'active') return 'აქტიური'
  if (status === 'alert') return 'ალერტი'
  if (status === 'warning') return 'ყურადღება'
  return 'ოფლაინ'
}

function relativeTime(recordedAt: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(recordedAt).getTime()) / 60000))
  if (minutes < 1) return 'ახლახან'
  if (minutes < 60) return `${minutes} წუთის წინ`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} საათის წინ`
  return `${Math.floor(hours / 24)} დღის წინ`
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KAYA.surface },
  list: { padding: 16, gap: 10, paddingBottom: 28 },
  header: { gap: 8, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '700', color: KAYA.textPrimary },
  subtitle: { fontSize: 12, color: KAYA.textSecondary },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: KAYA.warningBg,
    borderRadius: 10,
    marginTop: 8,
  },
  noticeText: { flex: 1, fontSize: 12, color: KAYA.warningText, lineHeight: 17 },
  card: {
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700' },
  cardBody: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '700', color: KAYA.textPrimary },
  meta: { fontSize: 12, color: KAYA.textSecondary, marginTop: 3 },
  coords: { fontSize: 11, color: KAYA.textTertiary, marginTop: 3, fontVariant: ['tabular-nums'] },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { fontSize: 11, fontWeight: '700' },
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
