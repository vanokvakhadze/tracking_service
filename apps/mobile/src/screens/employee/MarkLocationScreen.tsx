import { Feather } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getCurrentUser } from '@/src/services/auth'
import { submitProvisionalLocation } from '@/src/services/provisional'

const KAYA = {
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  accent: '#1565C0',
  accentTint: '#E3F2FD',
  warning: '#CA8A04',
  warningBg: '#FEFCE8',
  warningText: '#A16207',
}

interface CapturedPhoto {
  uri: string
  base64: string
  lat: number
  lng: number
}

export default function MarkLocationScreen() {
  const [cameraPerm, requestCameraPerm] = useCameraPermissions()
  const cameraRef = useRef<CameraView | null>(null)
  const [captured, setCaptured] = useState<CapturedPhoto | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  if (!cameraPerm) {
    return <Center>იტვირთება…</Center>
  }

  if (!cameraPerm.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permWrap}>
          <Feather name="camera" size={36} color={KAYA.accent} />
          <Text style={styles.permTitle}>კამერის ნებართვა</Text>
          <Text style={styles.permText}>ლოკაციის მონიშვნისთვის გვჭირდება ფოტოს გადაღება.</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestCameraPerm}>
            <Text style={styles.permBtnText}>ნებართვის თხოვნა</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  async function capture() {
    if (busy || !cameraRef.current) return
    setBusy(true)
    try {
      // Grab the GPS at the exact moment of capture — this is the location
      // the admin will review, not where the user happens to stand later.
      const positionPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      const photoPromise = cameraRef.current.takePictureAsync({
        quality: 0.55,
        base64: true,
        skipProcessing: false,
      })
      const [photo, position] = await Promise.all([photoPromise, positionPromise])
      if (!photo?.uri || !photo.base64) {
        Alert.alert('შეცდომა', 'ფოტოს გადაღება ვერ მოხერხდა.')
        return
      }
      setCaptured({
        uri: photo.uri,
        base64: photo.base64,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'უცნობი შეცდომა'
      Alert.alert('შეცდომა', message)
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    if (!captured) return
    setBusy(true)
    try {
      const me = await getCurrentUser()
      if (!me) throw new Error('სესია არ არის — გასცილდი და ისევ შემოდი.')
      const memberships = (me.memberships ?? []) as Array<{
        is_active: boolean | null
        tenant: { id: string } | { id: string }[] | null
      }>
      const active = memberships.find((m) => m.is_active)
      const tenant = Array.isArray(active?.tenant) ? active?.tenant[0] : active?.tenant
      if (!tenant?.id) throw new Error('აქტიური workspace ვერ მოიძებნა.')

      await submitProvisionalLocation({
        tenantId: tenant.id,
        userId: me.id,
        latitude: captured.lat,
        longitude: captured.lng,
        photoBase64: captured.base64,
        note: note || null,
      })

      Alert.alert('გადაცემული', 'მონიშვნა ადმინს გადაეცა.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'უცნობი შეცდომა'
      Alert.alert('შეცდომა', message)
    } finally {
      setBusy(false)
    }
  }

  if (captured) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={() => setCaptured(null)} disabled={busy}>
              <Feather name="arrow-left" size={22} color={KAYA.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>დაადასტურე გადაცემა</Text>
            <View style={{ width: 22 }} />
          </View>
          <Image source={{ uri: captured.uri }} style={styles.preview} resizeMode="cover" />
          <View style={styles.gpsCard}>
            <Feather name="map-pin" size={14} color={KAYA.accent} />
            <Text style={styles.gpsText}>
              {captured.lat.toFixed(5)}, {captured.lng.toFixed(5)}
            </Text>
          </View>
          <View style={styles.formWrap}>
            <Text style={styles.label}>ლოკაციის სახელი (სურვილისამებრ)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="მაგ. ვაკის სუპერმარკეტი"
              placeholderTextColor={KAYA.textTertiary}
              style={styles.input}
              editable={!busy}
            />
            <Text style={styles.help}>
              ადმინი დაამოწმებს და საბოლოო სახელს თვითონ მოანიჭებს, თუ ცარიელი დატოვე.
            </Text>
          </View>
          <View style={styles.previewFooter}>
            <TouchableOpacity
              style={[styles.secondaryBtn, busy && styles.btnDisabled]}
              onPress={() => setCaptured(null)}
              disabled={busy}
            >
              <Text style={styles.secondaryBtnText}>ხელახლა</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, busy && styles.btnDisabled]}
              onPress={submit}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryBtnText}>გადაცემა</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <SafeAreaView style={styles.cameraOverlay} edges={['top', 'bottom']}>
        <View style={styles.cameraHeader}>
          <TouchableOpacity style={styles.cameraClose} onPress={() => router.back()}>
            <Feather name="x" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>ლოკაციის მონიშვნა</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.cameraHint}>
          <Text style={styles.cameraHintText}>გადაიღე სამუშაო ადგილის ფოტო</Text>
          <Text style={styles.cameraHintSub}>GPS ავტომატურად დაიწერება</Text>
        </View>
        <View style={styles.shutterRow}>
          <TouchableOpacity
            style={[styles.shutter, busy && styles.btnDisabled]}
            onPress={capture}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color={KAYA.accent} />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={{ color: KAYA.textSecondary }}>{children}</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KAYA.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  permWrap: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  permTitle: { fontSize: 18, fontWeight: '700', color: KAYA.textPrimary },
  permText: { fontSize: 13, color: KAYA.textSecondary, textAlign: 'center' },
  permBtn: {
    marginTop: 8,
    backgroundColor: KAYA.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { ...StyleSheet.absoluteFillObject },
  cameraOverlay: { flex: 1, justifyContent: 'space-between' },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cameraClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  cameraHint: { alignItems: 'center', gap: 4 },
  cameraHintText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(15,23,42,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cameraHintSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
  },
  shutterRow: { alignItems: 'center', paddingBottom: 20 },
  shutter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFF',
  },

  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: KAYA.border,
    borderBottomWidth: 1,
  },
  previewTitle: { fontSize: 16, fontWeight: '700', color: KAYA.textPrimary },
  preview: { width: '100%', height: 280, backgroundColor: '#000' },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: KAYA.accentTint,
    paddingHorizontal: 14,
    paddingVertical: 10,
    margin: 16,
    borderRadius: 8,
  },
  gpsText: {
    fontSize: 13,
    fontWeight: '600',
    color: KAYA.accent,
    fontVariant: ['tabular-nums'],
  },
  formWrap: { paddingHorizontal: 16, gap: 8 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: KAYA.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
  help: { fontSize: 11, color: KAYA.textTertiary, lineHeight: 16 },

  previewFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 'auto',
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KAYA.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: KAYA.textPrimary },
  primaryBtn: {
    flex: 2,
    height: 48,
    borderRadius: 8,
    backgroundColor: KAYA.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  btnDisabled: { opacity: 0.5 },
})
