import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const KAYA = {
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  accent: '#1565C0',
  warningBg: '#FEFCE8',
  warningBorder: '#FDE68A',
  warningText: '#A16207',
}

export default function CreateLocationMapFallbackScreen() {
  const [lat, setLat] = useState('41.7167')
  const [lng, setLng] = useState('44.7833')
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleContinue() {
    const latitude = Number(lat)
    const longitude = Number(lng)
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setError('latitude უნდა იყოს -90-დან 90-მდე')
      return
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setError('longitude უნდა იყოს -180-დან 180-მდე')
      return
    }
    setError(null)
    router.push({
      pathname: '/admin-location-form',
      params: { lat: String(latitude), lng: String(longitude), address },
    })
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Feather name="x" size={22} color={KAYA.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>ლოკაციის შერჩევა</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.warning}>
          <Feather name="info" size={16} color={KAYA.warningText} />
          <Text style={styles.warningText}>
            ეს ფიჩერი მხოლოდ dev build-ში მუშაობს. Expo Go-ში შეიყვანე კოორდინატები ხელით.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Latitude</Text>
            <TextInput
              value={lat}
              onChangeText={setLat}
              keyboardType="decimal-pad"
              placeholder="41.7167"
              placeholderTextColor={KAYA.textTertiary}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Longitude</Text>
            <TextInput
              value={lng}
              onChangeText={setLng}
              keyboardType="decimal-pad"
              placeholder="44.7833"
              placeholderTextColor={KAYA.textTertiary}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>მისამართი (სურვილისამებრ)</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="მაგ. ვაჟა-ფშაველას 76"
              placeholderTextColor={KAYA.textTertiary}
              style={styles.input}
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Feather name="alert-triangle" size={14} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>გავაგრძელო</Text>
            <Feather name="arrow-right" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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

  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: KAYA.warningBg,
    borderColor: KAYA.warningBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    margin: 16,
  },
  warningText: { flex: 1, fontSize: 12, color: KAYA.warningText, lineHeight: 18 },

  form: { paddingHorizontal: 16, gap: 14, flex: 1 },
  field: { gap: 6 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: KAYA.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: KAYA.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    color: KAYA.textPrimary,
    backgroundColor: KAYA.bg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  errorText: { flex: 1, fontSize: 12, color: '#B91C1C' },

  footer: { padding: 16 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: KAYA.accent,
    paddingVertical: 14,
    borderRadius: 10,
  },
  primaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
})
