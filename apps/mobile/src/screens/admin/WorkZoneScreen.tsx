import { useMobileRole } from '@/src/hooks/use-mobile-role'
import { type WorkZoneLocation, fetchWorkZone, updateWorkZone } from '@/src/services/work-zone'
import { Feather } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
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
  warningBorder: '#FDE68A',
  warningText: '#A16207',
  errorBg: '#FEF2F2',
  errorText: '#B91C1C',
  successBg: '#F0FDF4',
  successText: '#15803D',
}

const isExpoGo = Constants.executionEnvironment === 'storeClient'
const Preview = isExpoGo
  ? null
  : (require('@/src/screens/admin/WorkZonePreview').default as React.ComponentType<{
      latitude: number
      longitude: number
      triggerRadiusM: number
      boundaryRadiusM: number
    }>)

const TRIGGER_MIN = 50
const TRIGGER_MAX = 1500
const TRIGGER_STEP = 50
const BOUNDARY_MIN = 100
const BOUNDARY_MAX = 5000
const BOUNDARY_STEP = 50

interface Props {
  locationId: string
}

export default function WorkZoneScreen({ locationId }: Props) {
  const role = useMobileRole()
  const [location, setLocation] = useState<WorkZoneLocation | null>(null)
  const [triggerRadius, setTriggerRadius] = useState(100)
  const [boundaryRadius, setBoundaryRadius] = useState(200)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchWorkZone(locationId).then((data) => {
      if (!alive) return
      if (data) {
        setLocation(data)
        setTriggerRadius(data.trigger_radius_m)
        setBoundaryRadius(data.boundary_radius_m)
      }
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [locationId])

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notice}>
          <ActivityIndicator color={KAYA.accent} />
        </View>
      </SafeAreaView>
    )
  }

  if (!location) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notice}>
          <Feather name="alert-triangle" size={20} color={KAYA.errorText} />
          <Text style={styles.noticeText}>ლოკაცია ვერ მოიძებნა.</Text>
        </View>
      </SafeAreaView>
    )
  }

  async function save() {
    if (triggerRadius > boundaryRadius) {
      setError('Trigger Boundary-ზე მეტი ვერ იქნება')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await updateWorkZone({
        locationId,
        triggerRadiusM: triggerRadius,
        boundaryRadiusM: boundaryRadius,
      })
      Alert.alert('შენახული', 'სამუშაო ზონა წარმატებით განახლდა', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'უცნობი შეცდომა')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="arrow-left" size={22} color={KAYA.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.title}>სამუშაო ზონა</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {location.name || 'უსახელო ლოკაცია'}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {Preview ? (
          <View style={styles.previewWrap}>
            <Preview
              latitude={location.latitude}
              longitude={location.longitude}
              triggerRadiusM={triggerRadius}
              boundaryRadiusM={boundaryRadius}
            />
          </View>
        ) : (
          <View style={styles.previewFallback}>
            <Feather name="map-pin" size={20} color={KAYA.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.previewLabel}>ცენტრი</Text>
              <Text style={styles.previewValue}>
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </Text>
              {location.address && <Text style={styles.previewAddress}>{location.address}</Text>}
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.dot, { backgroundColor: KAYA.accent }]} />
            <Text style={styles.infoLabel}>Trigger zone</Text>
            <Text style={styles.infoHelp}>auto shift start/end</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.dot, { backgroundColor: KAYA.warning }]} />
            <Text style={styles.infoLabel}>Boundary zone</Text>
            <Text style={styles.infoHelp}>alert ფარგლები</Text>
          </View>
          <Text style={styles.infoHysteresis}>
            ⓘ შესვლის ჰისტერეზისი 30 წამი, გასვლის 60 წამი. ეს Phase 3 SDK-ის პარამეტრებია და აქ არ
            იცვლება.
          </Text>
        </View>

        <Stepper
          label="Trigger რადიუსი"
          value={triggerRadius}
          min={TRIGGER_MIN}
          max={TRIGGER_MAX}
          step={TRIGGER_STEP}
          tone="accent"
          disabled={saving}
          onChange={setTriggerRadius}
        />

        <Stepper
          label="Boundary რადიუსი"
          value={boundaryRadius}
          min={BOUNDARY_MIN}
          max={BOUNDARY_MAX}
          step={BOUNDARY_STEP}
          tone="warning"
          disabled={saving}
          onChange={setBoundaryRadius}
        />

        {triggerRadius > boundaryRadius && (
          <View style={styles.warnBox}>
            <Feather name="alert-triangle" size={14} color={KAYA.warningText} />
            <Text style={styles.warnText}>
              Trigger ({triggerRadius}მ) Boundary-ზე ({boundaryRadius}მ) მეტი ვერ იქნება
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
          style={[
            styles.primaryBtn,
            (saving || triggerRadius > boundaryRadius) && { opacity: 0.5 },
          ]}
          onPress={save}
          disabled={saving || triggerRadius > boundaryRadius}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Feather name="save" size={16} color="#FFF" />
              <Text style={styles.primaryBtnText}>შენახვა</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
        <Text style={styles.fieldLabel}>{label}</Text>
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
        <View style={styles.stepperTrack}>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: KAYA.border,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: KAYA.textPrimary },
  subtitle: { fontSize: 12, color: KAYA.textSecondary, marginTop: 2 },

  scroll: { padding: 16, paddingBottom: 32, gap: 16 },

  previewWrap: {
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: KAYA.border,
  },
  previewFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
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
  previewAddress: { fontSize: 12, color: KAYA.textSecondary, marginTop: 4 },

  infoCard: {
    backgroundColor: KAYA.surface,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: KAYA.border,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  infoLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: KAYA.textPrimary },
  infoHelp: { fontSize: 12, color: KAYA.textSecondary },
  infoHysteresis: { fontSize: 11, color: KAYA.textTertiary, marginTop: 6, lineHeight: 16 },

  field: { gap: 8 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: KAYA.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

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
  stepperTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: KAYA.surface2,
  },
  stepperValue: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  help: { fontSize: 11, color: KAYA.textTertiary },

  warnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: KAYA.warningBg,
    borderColor: KAYA.warningBorder,
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
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  errorText: { flex: 1, fontSize: 12, color: KAYA.errorText },

  notice: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
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
