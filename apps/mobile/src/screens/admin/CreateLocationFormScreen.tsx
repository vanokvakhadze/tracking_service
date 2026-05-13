import { useMobileRole } from '@/src/hooks/use-mobile-role'
import { type AdminLocationCategory, createAdminLocation } from '@/src/services/admin-locations'
import { getCurrentUser } from '@/src/services/auth'
import { Feather } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
  surface2: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  accent: '#1565C0',
  accentTint: '#E3F2FD',
  warning: '#CA8A04',
  warningBg: '#FEFCE8',
  warningText: '#A16207',
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
  errorText: '#B91C1C',
}

const isExpoGo = Constants.executionEnvironment === 'storeClient'
const MapPreview = isExpoGo
  ? null
  : (require('@/src/screens/admin/CreateLocationMapPreview').default as React.ComponentType<{
      latitude: number
      longitude: number
      radiusM: number
    }>)

const CATEGORIES: { value: AdminLocationCategory; label: string }[] = [
  { value: 'office', label: 'ოფისი' },
  { value: 'client_site', label: 'კლიენტი' },
  { value: 'warehouse', label: 'საწყობი' },
  { value: 'checkpoint', label: 'საკონტროლო' },
  { value: 'other', label: 'სხვა' },
]

const TRIGGER_MIN = 50
const TRIGGER_MAX = 1500
const TRIGGER_STEP = 50
const BOUNDARY_MIN = 100
const BOUNDARY_MAX = 5000
const BOUNDARY_STEP = 50

export default function CreateLocationFormScreen() {
  const params = useLocalSearchParams<{ lat?: string; lng?: string; address?: string }>()
  const role = useMobileRole()
  const latitude = Number(params.lat)
  const longitude = Number(params.lng)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<AdminLocationCategory>('office')
  const [address, setAddress] = useState(params.address ?? '')
  const [triggerRadius, setTriggerRadius] = useState(100)
  const [boundaryRadius, setBoundaryRadius] = useState(200)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const coordsValid = useMemo(
    () =>
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180,
    [latitude, longitude],
  )

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

  if (!coordsValid) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notice}>
          <Feather name="alert-triangle" size={20} color={KAYA.errorText} />
          <Text style={styles.noticeText}>კოორდინატები ვერ მოიძებნა — დაბრუნდი რუკაზე.</Text>
        </View>
      </SafeAreaView>
    )
  }

  async function submit() {
    setError(null)
    if (name.trim().length < 2) {
      setError('სახელი მინიმუმ 2 სიმბოლო უნდა იყოს')
      return
    }
    if (triggerRadius > boundaryRadius) {
      setError('Trigger რადიუსი Boundary რადიუსზე მეტი ვერ იქნება')
      return
    }
    setBusy(true)
    try {
      const me = await getCurrentUser()
      const memberships = (me?.memberships ?? []) as Array<{
        is_active: boolean | null
        tenant: { id: string } | { id: string }[] | null
      }>
      const active = memberships.find((m) => m.is_active)
      const tenant = Array.isArray(active?.tenant) ? active?.tenant[0] : active?.tenant
      if (!tenant?.id) throw new Error('აქტიური workspace ვერ მოიძებნა')

      await createAdminLocation({
        tenantId: tenant.id,
        name: name.trim(),
        category,
        address: address.trim() || null,
        latitude,
        longitude,
        triggerRadiusM: triggerRadius,
        boundaryRadiusM: boundaryRadius,
      })

      Alert.alert('შენახული', 'ლოკაცია წარმატებით შეიქმნა', [
        { text: 'OK', onPress: () => router.replace('/admin-dashboard') },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'უცნობი შეცდომა')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Feather name="arrow-left" size={22} color={KAYA.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>ლოკაციის დეტალები</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {MapPreview ? (
            <View style={styles.previewWrap}>
              <MapPreview latitude={latitude} longitude={longitude} radiusM={triggerRadius} />
            </View>
          ) : (
            <View style={styles.previewFallback}>
              <Feather name="map-pin" size={20} color={KAYA.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.previewLabel}>კოორდინატები</Text>
                <Text style={styles.previewValue}>
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>სახელი</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="მაგ. ცენტრალური ოფისი"
              placeholderTextColor={KAYA.textTertiary}
              style={styles.input}
              editable={!busy}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>კატეგორია</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((c) => {
                const active = c.value === category
                return (
                  <TouchableOpacity
                    key={c.value}
                    onPress={() => setCategory(c.value)}
                    style={[styles.categoryBtn, active && styles.categoryBtnActive]}
                    disabled={busy}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>მისამართი</Text>
              <TouchableOpacity onPress={() => router.back()} disabled={busy}>
                <Text style={styles.editLink}>რედაქტირება</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="ვაჟა-ფშაველას 76"
              placeholderTextColor={KAYA.textTertiary}
              style={styles.input}
              editable={!busy}
            />
          </View>

          <Stepper
            label="Trigger რადიუსი (shift auto start/end)"
            value={triggerRadius}
            min={TRIGGER_MIN}
            max={TRIGGER_MAX}
            step={TRIGGER_STEP}
            tone="accent"
            onChange={setTriggerRadius}
            disabled={busy}
          />

          <Stepper
            label="Boundary რადიუსი (alert zone)"
            value={boundaryRadius}
            min={BOUNDARY_MIN}
            max={BOUNDARY_MAX}
            step={BOUNDARY_STEP}
            tone="warning"
            onChange={setBoundaryRadius}
            disabled={busy}
          />

          {triggerRadius > boundaryRadius && (
            <View style={styles.warnBox}>
              <Feather name="alert-triangle" size={14} color={KAYA.warningText} />
              <Text style={styles.warnText}>
                Trigger Boundary-ზე მეტი ვერ იქნება ({triggerRadius} {'>'} {boundaryRadius})
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Feather name="x-circle" size={14} color={KAYA.errorText} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
            onPress={submit}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Feather name="check" size={16} color="#FFF" />
                <Text style={styles.primaryBtnText}>შენახვა</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function Stepper({
  label,
  value,
  min,
  max,
  step,
  tone,
  disabled,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  tone: 'accent' | 'warning'
  disabled: boolean
  onChange: (v: number) => void
}) {
  const color = tone === 'accent' ? KAYA.accent : KAYA.warningText
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.stepperValue, { color }]}>{value} მ</Text>
      </View>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, value - step))}
          disabled={disabled || value <= min}
          style={[styles.stepperBtn, (disabled || value <= min) && styles.stepperBtnDisabled]}
          activeOpacity={0.8}
        >
          <Feather name="minus" size={16} color={KAYA.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.stepperTrack, { backgroundColor: KAYA.surface2 }]}>
          <View
            style={{
              backgroundColor: color,
              height: '100%',
              width: `${((value - min) / (max - min)) * 100}%`,
              borderRadius: 999,
            }}
          />
        </View>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + step))}
          disabled={disabled || value >= max}
          style={[styles.stepperBtn, (disabled || value >= max) && styles.stepperBtnDisabled]}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={16} color={KAYA.textPrimary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.help}>
        {min}მ — {max}მ ({step}მ ბიჯი)
      </Text>
    </View>
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

  scroll: { padding: 16, paddingBottom: 32, gap: 16 },

  previewWrap: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: KAYA.border,
  },
  previewFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KAYA.border,
    backgroundColor: KAYA.accentTint,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: KAYA.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '700',
    color: KAYA.accent,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },

  field: { gap: 8 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: KAYA.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editLink: { fontSize: 12, fontWeight: '600', color: KAYA.accent },
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

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: KAYA.border,
    backgroundColor: KAYA.bg,
  },
  categoryBtnActive: {
    borderColor: KAYA.accent,
    backgroundColor: KAYA.accentTint,
  },
  categoryText: { fontSize: 13, color: KAYA.textSecondary, fontWeight: '600' },
  categoryTextActive: { color: KAYA.accent },

  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KAYA.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: KAYA.bg,
  },
  stepperBtnDisabled: { opacity: 0.4 },
  stepperTrack: { flex: 1, height: 6, borderRadius: 999, overflow: 'hidden' },
  stepperValue: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  help: { fontSize: 11, color: KAYA.textTertiary },

  warnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: KAYA.warningBg,
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  warnText: { flex: 1, fontSize: 12, color: KAYA.warningText },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: KAYA.errorBg,
    borderColor: KAYA.errorBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  errorText: { flex: 1, fontSize: 12, color: KAYA.errorText },

  notice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  noticeText: { fontSize: 14, color: KAYA.textSecondary, textAlign: 'center' },

  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: KAYA.border,
    backgroundColor: KAYA.bg,
  },
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
