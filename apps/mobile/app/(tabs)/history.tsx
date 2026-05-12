import { Feather } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  type Range,
  type ShiftHistoryRow,
  aggregateTotals,
  fetchShiftsInRange,
  formatHoursMinutes,
} from '@/src/services/shifts-history'

const KAYA = {
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  surface2: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  accent: '#1565C0',
  accentFg: '#FFFFFF',
  accentTint: '#E3F2FD',
  successBg: '#F0FDF4',
  successText: '#15803D',
}

const RANGE_LABELS: Record<Range, string> = {
  day: 'დღეს',
  week: 'კვირა',
  month: 'თვე',
}

export default function HistoryTab() {
  const [range, setRange] = useState<Range>('week')
  const [rows, setRows] = useState<ShiftHistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    const next = await fetchShiftsInRange(range)
    setRows(next)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    setLoading(true)
    load()
  }, [range])

  const totals = aggregateTotals(rows)
  const km = (totals.totalDistanceM / 1000).toFixed(1)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              load()
            }}
          />
        }
      >
        <Text style={styles.title}>ისტორია</Text>

        <View style={styles.tabs}>
          {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              activeOpacity={0.8}
              style={[styles.tab, range === r && styles.tabActive]}
            >
              <Text style={[styles.tabText, range === r && styles.tabTextActive]}>
                {RANGE_LABELS[r]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.hero}>
          <View>
            <Text style={styles.heroLabel}>ჯამური {rangeSubject(range)}</Text>
            <Text style={styles.heroValue}>{formatHoursMinutes(totals.totalMinutes)}</Text>
            <Text style={styles.heroSub}>სამუშაო დრო</Text>
          </View>
          <View>
            <Text style={styles.heroValue}>{km} კმ</Text>
            <Text style={styles.heroSub}>მანძილი</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>იტვირთება…</Text>
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="clock" size={24} color={KAYA.textTertiary} />
            <Text style={styles.emptyTitle}>ჯერ ცვლა არ ჩაწერილა</Text>
            <Text style={styles.emptyText}>
              ცვლები გამოჩნდება როცა Phase 3 SDK ჩაერთვება და მუშაობას დაიწყებ.
            </Text>
          </View>
        ) : (
          rows.map((row) => <ShiftRow key={row.id} row={row} />)
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function rangeSubject(range: Range): string {
  if (range === 'day') return 'დღეს'
  if (range === 'week') return 'ამ კვირაში'
  return 'ამ თვეში'
}

function ShiftRow({ row }: { row: ShiftHistoryRow }) {
  const isActive = row.status === 'active' && !row.ended_at
  const date = new Date(row.started_at)
  const datePrefix = date.toLocaleDateString('ka-GE', { month: '2-digit', day: '2-digit' })
  const weekday = date.toLocaleDateString('ka-GE', { weekday: 'long' })
  const minutes =
    row.total_dwell_minutes ??
    (row.ended_at
      ? Math.floor((new Date(row.ended_at).getTime() - new Date(row.started_at).getTime()) / 60000)
      : 0)
  const km = ((row.total_distance_m ?? 0) / 1000).toFixed(1)
  const visits = row.locations_visited ?? 0

  return (
    <View style={[styles.shiftCard, isActive && styles.shiftCardActive]}>
      <View style={styles.shiftHead}>
        <Text style={styles.shiftDate}>{isActive ? 'დღევანდელი' : `${datePrefix} ${weekday}`}</Text>
        {isActive ? (
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBadgeText}>აქტიური</Text>
          </View>
        ) : (
          <Text style={styles.shiftDuration}>{formatHoursMinutes(minutes)}</Text>
        )}
      </View>
      <View style={styles.shiftMeta}>
        <View style={styles.metaItem}>
          <Feather name="clock" size={12} color={KAYA.textTertiary} />
          <Text style={styles.metaText}>{formatHoursMinutes(minutes)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="map-pin" size={12} color={KAYA.textTertiary} />
          <Text style={styles.metaText}>{visits} ლოკაცია</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="trending-up" size={12} color={KAYA.textTertiary} />
          <Text style={styles.metaText}>{km} კმ</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KAYA.surface },
  scroll: { padding: 16, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: KAYA.textPrimary, marginBottom: 8 },
  tabs: { flexDirection: 'row', backgroundColor: KAYA.surface2, borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: KAYA.bg },
  tabText: { fontSize: 13, fontWeight: '600', color: KAYA.textSecondary },
  tabTextActive: { color: KAYA.textPrimary },

  hero: {
    backgroundColor: KAYA.accent,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroLabel: { color: KAYA.accentTint, fontSize: 12, marginBottom: 4 },
  heroValue: {
    color: KAYA.accentFg,
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  heroSub: { color: KAYA.accentTint, fontSize: 11, marginTop: 2 },

  shiftCard: {
    backgroundColor: KAYA.bg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: KAYA.border,
  },
  shiftCardActive: { borderColor: KAYA.accent, backgroundColor: KAYA.bg },
  shiftHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shiftDate: { fontSize: 14, fontWeight: '700', color: KAYA.textPrimary },
  shiftDuration: { fontSize: 13, fontWeight: '600', color: KAYA.textSecondary },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: KAYA.successBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  activeBadgeText: { fontSize: 11, fontWeight: '600', color: KAYA.successText },
  shiftMeta: { flexDirection: 'row', gap: 16, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: KAYA.textSecondary },

  empty: {
    backgroundColor: KAYA.bg,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: KAYA.border,
    gap: 8,
  },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: KAYA.textPrimary },
  emptyText: { fontSize: 12, color: KAYA.textSecondary, textAlign: 'center' },
})
