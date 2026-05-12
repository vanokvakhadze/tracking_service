import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { formatDuration, useCurrentShift } from '@/src/hooks/use-current-shift'

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
  success: '#16A34A',
  warningBg: '#FEFCE8',
  warningText: '#A16207',
}

export default function HomeScreen() {
  const { shift, loading } = useCurrentShift()

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.subtle}>იტვირთება…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {shift ? <ActiveShiftView shift={shift} /> : <InactiveView />}
      </ScrollView>
    </SafeAreaView>
  )
}

function ActiveShiftView({
  shift,
}: { shift: NonNullable<ReturnType<typeof useCurrentShift>['shift']> }) {
  const [elapsed, setElapsed] = useState(() => Date.now() - new Date(shift.started_at).getTime())

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - new Date(shift.started_at).getTime())
    }, 1000)
    return () => clearInterval(interval)
  }, [shift.started_at])

  const km = ((shift.total_distance_m ?? 0) / 1000).toFixed(1)
  const visits = shift.locations_visited ?? 0

  return (
    <>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>ცვლა მიმდინარეობს</Text>
        <Text style={styles.heroTimer}>{formatDuration(elapsed)}</Text>
        <Text style={styles.heroSub}>
          {new Date(shift.started_at).toLocaleTimeString('ka-GE')} დაიწყო
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="მანძილი" value={`${km} კმ`} />
        <StatCard label="ვიზიტი" value={String(visits)} />
      </View>
    </>
  )
}

function InactiveView() {
  return (
    <>
      <View style={styles.inactiveHeader}>
        <Text style={styles.title}>გამარჯობა 👋</Text>
        <Text style={styles.subtle}>ცვლის გარეთ ხართ</Text>
      </View>

      <View style={styles.bigCard}>
        <View style={styles.bigCardDot} />
        <Text style={styles.bigCardTitle}>ცვლა გათიშულია</Text>
        <Text style={styles.bigCardText}>
          ცვლა ავტომატურად დაიწყება როცა სამუშაო ლოკაციაზე მიხვალთ.
        </Text>
      </View>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>📋 ჯერ ფონური ტრეკინგი ჩართული არ არის</Text>
        <Text style={styles.noticeText}>
          Phase 3 SDK (react-native-background-geolocation) აქ ჩაერთვის. ცვლები ხელით უნდა შეიქმნას
          ადმინისგან ან Edge Function-დან.
        </Text>
      </View>
    </>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KAYA.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, gap: 16 },

  hero: {
    backgroundColor: KAYA.accent,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  heroLabel: {
    color: KAYA.accentTint,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTimer: {
    color: KAYA.accentFg,
    fontSize: 44,
    fontWeight: '700',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  heroSub: { color: KAYA.accentTint, fontSize: 12, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: KAYA.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KAYA.border,
    padding: 14,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: KAYA.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: KAYA.textPrimary,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },

  inactiveHeader: { paddingHorizontal: 4 },
  title: { fontSize: 22, fontWeight: '700', color: KAYA.textPrimary },
  subtle: { fontSize: 13, color: KAYA.textSecondary, marginTop: 2 },

  bigCard: {
    backgroundColor: KAYA.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KAYA.border,
    padding: 24,
    alignItems: 'center',
  },
  bigCardDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: KAYA.surface2,
    marginBottom: 12,
  },
  bigCardTitle: { fontSize: 16, fontWeight: '600', color: KAYA.textPrimary },
  bigCardText: {
    fontSize: 13,
    color: KAYA.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },

  noticeCard: {
    backgroundColor: KAYA.warningBg,
    borderRadius: 10,
    padding: 14,
  },
  noticeTitle: { fontSize: 13, fontWeight: '600', color: KAYA.warningText },
  noticeText: { fontSize: 12, color: KAYA.warningText, marginTop: 4, lineHeight: 17, opacity: 0.8 },
})
