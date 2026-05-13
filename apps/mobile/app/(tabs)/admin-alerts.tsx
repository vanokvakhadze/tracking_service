import { Feather } from '@expo/vector-icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  fetchAdminAlerts,
  type AdminAlert,
  type AlertKind,
  type AlertSeverity,
} from '@/src/services/alerts'

const KAYA = {
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  accent: '#1565C0',
  accentFg: '#FFFFFF',
}

const TONES: Record<AlertSeverity, { bg: string; iconBg: string; text: string }> = {
  critical: { bg: '#FEF2F2', iconBg: '#FECACA', text: '#DC2626' },
  warning: { bg: '#FEFCE8', iconBg: '#FEF3C7', text: '#A16207' },
}

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    const rows = await fetchAdminAlerts()
    setAlerts(rows)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const visibleAlerts = useMemo(
    () => alerts.filter((alert) => !dismissedIds.has(alert.id)),
    [alerts, dismissedIds],
  )
  const criticalAlerts = visibleAlerts.filter((alert) => alert.severity === 'critical')
  const warningAlerts = visibleAlerts.filter((alert) => alert.severity === 'warning')

  function dismiss(id: string) {
    setDismissedIds((current) => new Set(current).add(id))
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>ალერტი</Text>
            <Text style={styles.subtitle}>
              {criticalAlerts.length} აქტიური · {warningAlerts.length} დაკვირვება
            </Text>
          </View>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => load(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.linkText}>განახლება</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chips}>
          <StatChip label="ყველა" value={visibleAlerts.length} active />
          <StatChip label="კრიტიკული" value={criticalAlerts.length} />
          <StatChip label="გაფრთხილება" value={warningAlerts.length} />
        </View>

        {visibleAlerts.length === 0 ? (
          <EmptyState loading={loading} />
        ) : (
          <View style={styles.sections}>
            <AlertSection title="კრიტიკული" alerts={criticalAlerts} onDismiss={dismiss} />
            <AlertSection title="გაფრთხილება" alerts={warningAlerts} onDismiss={dismiss} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function AlertSection({
  title,
  alerts,
  onDismiss,
}: {
  title: string
  alerts: AdminAlert[]
  onDismiss: (id: string) => void
}) {
  if (alerts.length === 0) return null
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} onDismiss={() => onDismiss(alert.id)} />
      ))}
    </View>
  )
}

function AlertCard({ alert, onDismiss }: { alert: AdminAlert; onDismiss: () => void }) {
  const tone = TONES[alert.severity]
  return (
    <View style={[styles.card, { backgroundColor: tone.bg }]}>
      <View style={[styles.iconBox, { backgroundColor: tone.iconBg }]}>
        <Feather name={iconForKind(alert.kind)} size={22} color={tone.text} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: tone.iconBg }]}>
            <Text style={[styles.badgeText, { color: tone.text }]}>
              {severityLabel(alert.severity)}
            </Text>
          </View>
          <TouchableOpacity onPress={onDismiss} hitSlop={10}>
            <Feather name="x" size={18} color={tone.text} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.cardTitle, { color: tone.text }]}>{kindLabel(alert.kind)}</Text>
        <Text style={[styles.cardDetail, { color: tone.text }]}>{detailText(alert)}</Text>
        <Text style={[styles.cardTime, { color: tone.text }]}>
          {relativeTime(alert.occurred_at)}
        </Text>
      </View>
    </View>
  )
}

function StatChip({
  label,
  value,
  active = false,
}: { label: string; value: number; active?: boolean }) {
  return (
    <View style={[styles.chip, active ? styles.chipActive : null]}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
        {label} · {value}
      </Text>
    </View>
  )
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <View style={styles.empty}>
      <Feather name={loading ? 'loader' : 'check-circle'} size={26} color={KAYA.textTertiary} />
      <Text style={styles.emptyTitle}>{loading ? 'იტვირთება…' : 'ალერტი არ არის'}</Text>
      {!loading ? (
        <Text style={styles.emptyText}>ბოლო 7 დღეში საყურადღებო მოვლენა არ დაფიქსირდა.</Text>
      ) : null}
    </View>
  )
}

function kindLabel(kind: AlertKind) {
  if (kind === 'mock_gps') return 'ყალბი GPS'
  if (kind === 'location_disabled') return 'ლოკაცია გათიშულია'
  if (kind === 'low_battery') return 'დაბალი ბატარეა'
  return 'ზონის გარეთ'
}

function severityLabel(severity: AlertSeverity) {
  return severity === 'critical' ? 'კრიტიკული' : 'გაფრთხილება'
}

function iconForKind(kind: AlertKind) {
  if (kind === 'mock_gps') return 'shield-off'
  if (kind === 'location_disabled') return 'map-pin'
  if (kind === 'low_battery') return 'battery'
  return 'wifi-off'
}

function detailText(alert: AdminAlert) {
  if (alert.kind === 'low_battery')
    return `${alert.user_name} — დამუხტვა ${alert.details?.battery_percent ?? '?'}%`
  if (alert.kind === 'mock_gps') return `${alert.user_name} — საეჭვო ფიქსი`
  if (alert.kind === 'location_disabled') return `${alert.user_name} — GPS გათიშულია`
  return `${alert.user_name} — ${alert.details?.location_name ?? 'ლოკაცია'}`
}

function relativeTime(occurredAt: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(occurredAt).getTime()) / 60000))
  if (minutes < 1) return 'ახლახან'
  if (minutes < 60) return `${minutes} წუთის წინ`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} საათის წინ`
  return `${Math.floor(hours / 24)} დღის წინ`
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KAYA.surface },
  content: { padding: 16, paddingBottom: 28, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: 34, fontWeight: '700', color: KAYA.textPrimary },
  subtitle: { fontSize: 15, lineHeight: 22, color: KAYA.textSecondary, marginTop: 2 },
  linkButton: { paddingHorizontal: 10, paddingVertical: 6 },
  linkText: { fontSize: 15, fontWeight: '700', color: KAYA.accent },
  chips: { flexDirection: 'row', gap: 10 },
  chip: { borderRadius: 16, backgroundColor: KAYA.bg, paddingHorizontal: 16, paddingVertical: 13 },
  chipActive: { backgroundColor: KAYA.accent },
  chipText: { color: KAYA.textSecondary, fontSize: 14, fontWeight: '700' },
  chipTextActive: { color: KAYA.accentFg },
  sections: { gap: 16 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: KAYA.textTertiary, letterSpacing: 0.5 },
  card: { flexDirection: 'row', gap: 14, borderRadius: 24, padding: 18 },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 20, fontWeight: '700', marginTop: 10 },
  cardDetail: { fontSize: 15, lineHeight: 21, marginTop: 6 },
  cardTime: { fontSize: 13, marginTop: 10, opacity: 0.7 },
  empty: {
    backgroundColor: KAYA.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: KAYA.border,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: KAYA.textPrimary },
  emptyText: { fontSize: 12, color: KAYA.textSecondary, textAlign: 'center', lineHeight: 18 },
})
