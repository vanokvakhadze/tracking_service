import { Feather } from '@expo/vector-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import MapView, { Circle, Marker, type Region } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchTenantLocations, type MobileLocation } from '@/src/services/locations'
import { supabase } from '@/src/services/supabase'
import {
  fetchTeamPositions,
  type TeamPosition,
  type TeamStatus,
} from '@/src/services/team-positions'

const KAYA = {
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  surface2: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  accent: '#1565C0',
}

const STATUS_TONES: Record<TeamStatus, { bg: string; color: string }> = {
  active: { bg: '#E3F2FD', color: '#1565C0' },
  alert: { bg: '#FEF2F2', color: '#DC2626' },
  warning: { bg: '#FEFCE8', color: '#CA8A04' },
  offline: { bg: '#F1F5F9', color: '#94A3B8' },
}

const TBILISI_REGION: Region = {
  latitude: 41.7167,
  longitude: 44.7833,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
}

interface MapPoint {
  latitude: number
  longitude: number
}

export default function TeamMapScreen() {
  const mapRef = useRef<MapView | null>(null)
  const centeredRef = useRef(false)
  const [positions, setPositions] = useState<TeamPosition[]>([])
  const [locations, setLocations] = useState<MobileLocation[]>([])
  const [selected, setSelected] = useState<TeamPosition | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [positionRows, locationRows] = await Promise.all([
      fetchTeamPositions(),
      fetchTenantLocations(),
    ])
    setPositions(positionRows)
    setLocations(locationRows)
    setSelected((current) =>
      current ? (positionRows.find((row) => row.user_id === current.user_id) ?? null) : null,
    )
    if (!centeredRef.current) {
      centerMap(positionRows[0] ?? locationRows[0] ?? null)
      centeredRef.current = true
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const channel = supabase
      .channel('admin-team-pings')
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

  function centerMap(point: MapPoint | null) {
    mapRef.current?.animateToRegion(
      point
        ? {
            latitude: point.latitude,
            longitude: point.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }
        : TBILISI_REGION,
      400,
    )
  }

  function recenter() {
    centerMap(selected ?? positions[0] ?? locations[0] ?? null)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>ცოცხალი რუკა</Text>
          <Text style={styles.subtitle}>{positions.length} აქტიური თანამშრომელი</Text>
        </View>
        <View style={styles.filterButton}>
          <Feather name="filter" size={20} color={KAYA.textSecondary} />
        </View>
      </View>

      <View style={styles.statusRow}>
        <StatusChip status="active" label="აქტიური" count={countStatus(positions, 'active')} />
        <StatusChip status="warning" label="ყურადღება" count={countStatus(positions, 'warning')} />
        <StatusChip status="alert" label="ალერტი" count={countStatus(positions, 'alert')} />
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={TBILISI_REGION}
          showsMyLocationButton={false}
          onPress={() => setSelected(null)}
        >
          {locations.map((location) => (
            <Circle
              key={location.id}
              center={{ latitude: location.latitude, longitude: location.longitude }}
              radius={location.radius_m}
              strokeColor={KAYA.accent}
              strokeWidth={2}
              fillColor="rgba(21,101,192,0.15)"
            />
          ))}
          {positions.map((position) => (
            <Marker
              key={position.user_id}
              coordinate={{ latitude: position.latitude, longitude: position.longitude }}
              onPress={() => setSelected(position)}
            >
              <View
                style={[styles.markerHalo, { backgroundColor: STATUS_TONES[position.status].bg }]}
              >
                <View
                  style={[
                    styles.markerDot,
                    { backgroundColor: STATUS_TONES[position.status].color },
                  ]}
                />
              </View>
            </Marker>
          ))}
        </MapView>
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={KAYA.accent} />
          </View>
        ) : null}
        <TouchableOpacity style={styles.recenter} onPress={recenter} activeOpacity={0.8}>
          <Feather name="crosshair" size={18} color={KAYA.accent} />
        </TouchableOpacity>
      </View>

      {selected ? <SelectedCard position={selected} /> : <EmptyCard count={positions.length} />}
    </SafeAreaView>
  )
}

function StatusChip({
  status,
  label,
  count,
}: { status: TeamStatus; label: string; count: number }) {
  const tone = STATUS_TONES[status]
  return (
    <View style={[styles.statusChip, { backgroundColor: tone.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: tone.color }]} />
      <Text style={[styles.statusText, { color: tone.color }]}>
        {label} · {count}
      </Text>
    </View>
  )
}

function SelectedCard({ position }: { position: TeamPosition }) {
  const tone = STATUS_TONES[position.status]
  return (
    <View style={styles.selectedCard}>
      <View style={[styles.avatar, { backgroundColor: tone.bg }]}>
        <Text style={[styles.avatarText, { color: tone.color }]}>{position.user_initials}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.selectedName}>{position.user_name}</Text>
        <View style={[styles.badge, { backgroundColor: tone.bg }]}>
          <Text style={[styles.badgeText, { color: tone.color }]}>
            {statusLabel(position.status)}
          </Text>
        </View>
        <Text style={styles.selectedMeta}>{relativeTime(position.recorded_at)}</Text>
        <View style={styles.actionRow}>
          <View style={styles.actionButton}>
            <Feather name="phone" size={14} color={KAYA.textSecondary} />
            <Text style={styles.actionText}>ზარი</Text>
          </View>
          <View style={styles.actionButton}>
            <Feather name="message-circle" size={14} color={KAYA.textSecondary} />
            <Text style={styles.actionText}>შეტყობინება</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

function EmptyCard({ count }: { count: number }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyText}>
        {count === 0
          ? 'გუნდის ბოლო მდებარეობები ჯერ არ ჩანს.'
          : 'აირჩიე pin რუკაზე თანამშრომლის დეტალების სანახავად.'}
      </Text>
    </View>
  )
}

function countStatus(positions: TeamPosition[], status: TeamStatus) {
  return positions.filter((position) => position.status === status).length
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
  container: { flex: 1, backgroundColor: KAYA.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    gap: 12,
  },
  title: { fontSize: 28, fontWeight: '700', color: KAYA.textPrimary },
  subtitle: { fontSize: 12, color: KAYA.textSecondary, marginTop: 2 },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: KAYA.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  statusChip: { flex: 1, minHeight: 54, borderRadius: 16, padding: 10, justifyContent: 'center' },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginBottom: 5 },
  statusText: { fontSize: 12, fontWeight: '700' },
  mapWrap: { flex: 1, marginHorizontal: 16, borderRadius: 24, overflow: 'hidden' },
  map: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recenter: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: KAYA.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: KAYA.border,
  },
  markerHalo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: KAYA.bg,
  },
  markerDot: { width: 24, height: 24, borderRadius: 12 },
  selectedCard: {
    margin: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    backgroundColor: KAYA.bg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: KAYA.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 17, fontWeight: '700' },
  cardBody: { flex: 1, minWidth: 0 },
  selectedName: { fontSize: 18, fontWeight: '700', color: KAYA.textPrimary },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  selectedMeta: { fontSize: 13, color: KAYA.textSecondary, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: KAYA.surface2,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionText: { color: KAYA.textSecondary, fontSize: 12, fontWeight: '700' },
  emptyCard: {
    margin: 16,
    padding: 18,
    backgroundColor: KAYA.surface,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: { fontSize: 12, color: KAYA.textSecondary, textAlign: 'center' },
})
