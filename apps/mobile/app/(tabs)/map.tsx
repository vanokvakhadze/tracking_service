import { Feather } from '@expo/vector-icons'
import { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import MapView, { Circle, Marker, type Region } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchTenantLocations, type MobileLocation } from '@/src/services/locations'

const KAYA = {
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  accent: '#1565C0',
  success: '#16A34A',
  successBg: '#F0FDF4',
  successText: '#15803D',
}

const TBILISI_REGION: Region = {
  latitude: 41.7167,
  longitude: 44.7833,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
}

export default function MapTab() {
  const mapRef = useRef<MapView | null>(null)
  const [locations, setLocations] = useState<MobileLocation[]>([])
  const [selected, setSelected] = useState<MobileLocation | null>(null)

  useEffect(() => {
    fetchTenantLocations().then((rows) => {
      setLocations(rows)
      const first = rows[0]
      if (first) {
        mapRef.current?.animateToRegion(
          {
            latitude: first.latitude,
            longitude: first.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          },
          400,
        )
      }
    })
  }, [])

  function recenter() {
    const first = locations[0]
    if (first) {
      mapRef.current?.animateToRegion(
        {
          latitude: first.latitude,
          longitude: first.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        400,
      )
    } else {
      mapRef.current?.animateToRegion(TBILISI_REGION, 400)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>რუკა</Text>
          <Text style={styles.subtitle}>გეოფენსები ჩემს ირგვლივ</Text>
        </View>
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={TBILISI_REGION}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={() => setSelected(null)}
        >
          {locations.map((loc) => (
            <View key={loc.id}>
              <Circle
                center={{ latitude: loc.latitude, longitude: loc.longitude }}
                radius={loc.radius_m}
                strokeColor={KAYA.accent}
                strokeWidth={2}
                fillColor="rgba(21,101,192,0.15)"
              />
              <Marker
                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                title={loc.name}
                onPress={() => setSelected(loc)}
              />
            </View>
          ))}
        </MapView>

        <TouchableOpacity style={styles.recenter} onPress={recenter} activeOpacity={0.8}>
          <Feather name="crosshair" size={18} color={KAYA.accent} />
        </TouchableOpacity>
      </View>

      {selected ? (
        <View style={styles.selectedCard}>
          <View style={styles.check}>
            <Feather name="check" size={16} color={KAYA.successText} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedName}>{selected.name}</Text>
            {selected.address ? <Text style={styles.selectedAddr}>{selected.address}</Text> : null}
            <View style={styles.selectedMeta}>
              <View>
                <Text style={styles.metaLabel}>კატეგორია</Text>
                <Text style={styles.metaValue}>{categoryLabel(selected.category)}</Text>
              </View>
              <View>
                <Text style={styles.metaLabel}>რადიუსი</Text>
                <Text style={styles.metaValue}>{selected.radius_m} მ</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {locations.length === 0
              ? 'ჯერ ლოკაცია არ შექმნილა — ადმინმა უნდა დაამატოს.'
              : 'შეარჩიე pin რუკაზე დეტალების სანახავად.'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

function categoryLabel(category: MobileLocation['category']) {
  switch (category) {
    case 'office':
      return 'ოფისი'
    case 'client_site':
      return 'კლიენტი'
    case 'warehouse':
      return 'საწყობი'
    case 'checkpoint':
      return 'საკონტროლო'
    default:
      return 'სხვა'
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KAYA.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, flexDirection: 'row' },
  title: { fontSize: 28, fontWeight: '700', color: KAYA.textPrimary },
  subtitle: { fontSize: 12, color: KAYA.textSecondary, marginTop: 2 },
  mapWrap: { flex: 1, marginHorizontal: 16, borderRadius: 14, overflow: 'hidden' },
  map: { flex: 1 },
  recenter: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: KAYA.bg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  selectedCard: {
    margin: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: KAYA.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KAYA.border,
  },
  check: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: KAYA.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedName: { fontSize: 14, fontWeight: '700', color: KAYA.textPrimary },
  selectedAddr: { fontSize: 12, color: KAYA.textSecondary, marginTop: 2 },
  selectedMeta: { flexDirection: 'row', gap: 24, marginTop: 8 },
  metaLabel: {
    fontSize: 10,
    color: KAYA.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaValue: { fontSize: 13, fontWeight: '600', color: KAYA.textPrimary, marginTop: 2 },
  emptyCard: {
    margin: 16,
    padding: 18,
    backgroundColor: KAYA.surface,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: { fontSize: 12, color: KAYA.textSecondary, textAlign: 'center' },
})
