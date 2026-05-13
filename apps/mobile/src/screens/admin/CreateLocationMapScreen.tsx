import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import MapView, { Circle, Marker, type Region } from 'react-native-maps'
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
}

const TBILISI_REGION: Region = {
  latitude: 41.7167,
  longitude: 44.7833,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
}

const PLACEHOLDER_TRIGGER_M = 100

type Mode = 'map' | 'address'

interface GeocodeResult {
  id: string
  placeName: string
  latitude: number
  longitude: number
}

export default function CreateLocationMapScreen() {
  const mapRef = useRef<MapView | null>(null)
  const [mode, setMode] = useState<Mode>('map')
  const [pin, setPin] = useState({
    latitude: TBILISI_REGION.latitude,
    longitude: TBILISI_REGION.longitude,
  })
  const [address, setAddress] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (mode !== 'address' || query.trim().length < 2) {
      setResults([])
      return
    }
    const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      setResults([])
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&language=ka&country=ge&proximity=${pin.longitude},${pin.latitude}&limit=5`
        const res = await fetch(url, { signal: controller.signal })
        const json = (await res.json()) as { features?: Array<MapboxFeature> }
        setResults((json.features ?? []).map(toGeocodeResult).filter(Boolean) as GeocodeResult[])
      } catch (err) {
        if ((err as { name?: string }).name !== 'AbortError') {
          setResults([])
        }
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [mode, query, pin.longitude, pin.latitude])

  function pickResult(result: GeocodeResult) {
    setPin({ latitude: result.latitude, longitude: result.longitude })
    setAddress(result.placeName)
    setQuery(result.placeName)
    setResults([])
    mapRef.current?.animateToRegion(
      {
        latitude: result.latitude,
        longitude: result.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      300,
    )
  }

  function handleContinue() {
    router.push({
      pathname: '/admin-location-form',
      params: {
        lat: String(pin.latitude),
        lng: String(pin.longitude),
        address,
      },
    })
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={22} color={KAYA.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>ლოკაციის შერჩევა</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.tabRow}>
        <ModeTab active={mode === 'map'} onPress={() => setMode('map')} icon="map" label="რუკაზე" />
        <ModeTab
          active={mode === 'address'}
          onPress={() => setMode('address')}
          icon="search"
          label="მისამართით"
        />
      </View>

      {mode === 'address' && (
        <View style={styles.searchWrap}>
          <View style={styles.searchInput}>
            <Feather name="search" size={16} color={KAYA.textTertiary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="მაგ. ვაჟა-ფშაველას 76"
              placeholderTextColor={KAYA.textTertiary}
              style={styles.searchInputText}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searching && <ActivityIndicator size="small" color={KAYA.accent} />}
          </View>
          {results.length > 0 && (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              style={styles.resultList}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => pickResult(item)} style={styles.resultRow}>
                  <Feather name="map-pin" size={14} color={KAYA.textTertiary} />
                  <Text style={styles.resultText} numberOfLines={1}>
                    {item.placeName}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={TBILISI_REGION}
          onPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate
            setPin({ latitude, longitude })
          }}
        >
          <Marker
            coordinate={pin}
            draggable
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate
              setPin({ latitude, longitude })
            }}
          />
          <Circle
            center={pin}
            radius={PLACEHOLDER_TRIGGER_M}
            strokeColor={KAYA.accent}
            strokeWidth={2}
            fillColor="rgba(21,101,192,0.15)"
          />
        </MapView>
      </View>

      <View style={styles.coordsCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.coordLabel}>კოორდინატები</Text>
          <Text style={styles.coordValue}>
            {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
          </Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue}>
          <Text style={styles.primaryBtnText}>გავაგრძელო</Text>
          <Feather name="arrow-right" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

interface MapboxFeature {
  id?: string
  place_name?: string
  center?: [number, number]
}

function toGeocodeResult(feature: MapboxFeature): GeocodeResult | null {
  if (!feature.center || feature.center.length < 2) return null
  return {
    id: feature.id ?? `${feature.center[0]}-${feature.center[1]}`,
    placeName: feature.place_name ?? '',
    longitude: feature.center[0],
    latitude: feature.center[1],
  }
}

function ModeTab({
  active,
  onPress,
  icon,
  label,
}: {
  active: boolean
  onPress: () => void
  icon: keyof typeof Feather.glyphMap
  label: string
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      activeOpacity={0.8}
    >
      <Feather name={icon} size={14} color={active ? KAYA.accent : KAYA.textSecondary} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KAYA.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: KAYA.border,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: KAYA.textPrimary },

  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: KAYA.surface,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: KAYA.surface2,
  },
  tabBtnActive: { backgroundColor: KAYA.accentTint },
  tabText: { fontSize: 13, fontWeight: '600', color: KAYA.textSecondary },
  tabTextActive: { color: KAYA.accent },

  searchWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KAYA.border,
    backgroundColor: KAYA.bg,
  },
  searchInputText: {
    flex: 1,
    fontSize: 14,
    color: KAYA.textPrimary,
  },
  resultList: {
    marginTop: 8,
    maxHeight: 220,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KAYA.border,
    backgroundColor: KAYA.bg,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: KAYA.surface,
  },
  resultText: { flex: 1, fontSize: 13, color: KAYA.textPrimary },

  mapWrap: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  map: { flex: 1 },

  coordsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KAYA.border,
    backgroundColor: KAYA.bg,
  },
  coordLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: KAYA.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coordValue: {
    fontSize: 13,
    fontWeight: '700',
    color: KAYA.textPrimary,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: KAYA.accent,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
})
