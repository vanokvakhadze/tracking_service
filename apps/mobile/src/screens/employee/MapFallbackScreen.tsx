import { Feather } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchTenantLocations, type MobileLocation } from '@/src/services/locations'

const KAYA = {
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  accent: '#1565C0',
  accentTint: '#E3F2FD',
  warning: '#CA8A04',
  warningBg: '#FEFCE8',
  warningText: '#A16207',
}

export default function MapFallbackScreen() {
  const [locations, setLocations] = useState<MobileLocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTenantLocations().then((rows) => {
      setLocations(rows)
      setLoading(false)
    })
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>რუკა</Text>
        <Text style={styles.subtitle}>ლოკაციების სია</Text>
      </View>

      <View style={styles.notice}>
        <Feather name="info" size={16} color={KAYA.warningText} />
        <Text style={styles.noticeText}>
          ვიზუალური რუკა Expo Go-ში არ მუშაობს — საჭიროა Development Build (`eas build` ან `expo
          prebuild`). ეხლა ლოკაციები მხოლოდ სიად ჩანს.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {loading ? (
          <Text style={styles.muted}>იტვირთება…</Text>
        ) : locations.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>ჯერ ლოკაცია არ შექმნილა.</Text>
            <Text style={styles.emptyHint}>ადმინი ვებიდან დაამატებს.</Text>
          </View>
        ) : (
          locations.map((loc) => (
            <View key={loc.id} style={styles.card}>
              <View style={styles.pin}>
                <Feather name="map-pin" size={16} color={KAYA.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{loc.name}</Text>
                {loc.address ? <Text style={styles.cardAddr}>{loc.address}</Text> : null}
                <Text style={styles.cardCoords}>
                  {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)} · {loc.radius_m} მ
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KAYA.surface },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: KAYA.textPrimary },
  subtitle: { fontSize: 12, color: KAYA.textSecondary, marginTop: 2 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: KAYA.warningBg,
    borderRadius: 10,
  },
  noticeText: { flex: 1, fontSize: 12, color: KAYA.warningText, lineHeight: 17 },
  list: { padding: 16, gap: 10 },
  muted: { fontSize: 13, color: KAYA.textSecondary, textAlign: 'center', paddingTop: 30 },
  empty: { padding: 30, alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '600', color: KAYA.textPrimary },
  emptyHint: { fontSize: 12, color: KAYA.textTertiary, marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: KAYA.bg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: KAYA.border,
  },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: KAYA.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: { fontSize: 14, fontWeight: '600', color: KAYA.textPrimary },
  cardAddr: { fontSize: 12, color: KAYA.textSecondary, marginTop: 2 },
  cardCoords: {
    fontSize: 11,
    color: KAYA.textTertiary,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
})
