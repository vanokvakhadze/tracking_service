import { useMobileRole } from '@/src/hooks/use-mobile-role'
import { type PendingSubmission, fetchPendingSubmissions } from '@/src/services/provisional-admin'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const KAYA = {
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  surface2: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  accent: '#1565C0',
  accentTint: '#E3F2FD',
  warningText: '#A16207',
}

export default function ApproveLocationInbox() {
  const role = useMobileRole()
  const [items, setItems] = useState<PendingSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const rows = await fetchPendingSubmissions()
    setItems(rows)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  if (role === 'employee') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notice}>
          <Feather name="lock" size={20} color={KAYA.warningText} />
          <Text style={styles.noticeText}>მხოლოდ ადმინისთვის.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="arrow-left" size={22} color={KAYA.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>მოლოდინში</Text>
          <Text style={styles.subtitle}>{loading ? 'იტვირთება…' : `${items.length} მოთხოვნა`}</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => <SubmissionCard submission={item} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Feather name="inbox" size={28} color={KAYA.textTertiary} />
              <Text style={styles.emptyTitle}>მოლოდინში მოთხოვნა არ არის</Text>
              <Text style={styles.emptyText}>
                ახალი employee submissions აქ გამოჩნდება დასამტკიცებლად.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  )
}

function SubmissionCard({ submission }: { submission: PendingSubmission }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({ pathname: '/approve-location/[id]', params: { id: submission.id } })
      }
      activeOpacity={0.85}
    >
      {submission.photoSignedUrl ? (
        <Image
          source={{ uri: submission.photoSignedUrl }}
          style={styles.photo}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Feather name="image" size={24} color={KAYA.textTertiary} />
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{submission.employeeInitials}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.employeeName} numberOfLines={1}>
              {submission.employeeName}
            </Text>
            <Text style={styles.timeText}>{relativeTime(submission.submittedAt)}</Text>
          </View>
          <View style={styles.chevron}>
            <Feather name="chevron-right" size={18} color={KAYA.textTertiary} />
            <Text style={styles.actionText}>განხილვა</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Feather name="map-pin" size={12} color={KAYA.textTertiary} />
          <Text style={styles.metaText}>
            {submission.latitude.toFixed(4)}, {submission.longitude.toFixed(4)}
          </Text>
          {submission.distanceToNearestM !== null && (
            <Text style={styles.metaText}>· უახლოესი {submission.distanceToNearestM} მ</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

function relativeTime(submittedAt: string | null) {
  if (!submittedAt) return '—'
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(submittedAt).getTime()) / 60000))
  if (minutes < 1) return 'ახლახან'
  if (minutes < 60) return `${minutes} წუთის წინ`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} საათის წინ`
  return `${Math.floor(hours / 24)} დღის წინ`
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KAYA.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: KAYA.bg,
    borderBottomWidth: 1,
    borderBottomColor: KAYA.border,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: KAYA.textPrimary },
  subtitle: { fontSize: 12, color: KAYA.textSecondary, marginTop: 2 },

  list: { padding: 16, gap: 12, paddingBottom: 28 },
  card: {
    backgroundColor: KAYA.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KAYA.border,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: KAYA.surface2,
  },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 14, gap: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: KAYA.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: KAYA.accent },
  employeeName: { fontSize: 14, fontWeight: '700', color: KAYA.textPrimary },
  timeText: { fontSize: 12, color: KAYA.textSecondary, marginTop: 2 },
  chevron: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, fontWeight: '600', color: KAYA.textSecondary },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: {
    fontSize: 11,
    color: KAYA.textTertiary,
    fontVariant: ['tabular-nums'],
  },

  empty: {
    backgroundColor: KAYA.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KAYA.border,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: KAYA.textPrimary },
  emptyText: { fontSize: 12, color: KAYA.textSecondary, textAlign: 'center', lineHeight: 18 },
  notice: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  noticeText: { fontSize: 14, color: KAYA.textSecondary, textAlign: 'center' },
})
