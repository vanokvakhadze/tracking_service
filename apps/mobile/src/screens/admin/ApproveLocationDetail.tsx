import { useMobileRole } from '@/src/hooks/use-mobile-role'
import {
  type PendingSubmission,
  approveLocation,
  fetchPendingSubmission,
  rejectLocation,
} from '@/src/services/provisional-admin'
import { Feather } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
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
  success: '#16A34A',
  successText: '#15803D',
  warningText: '#A16207',
  error: '#DC2626',
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

type Action = null | 'approve' | 'reject'

interface Props {
  submissionId: string
}

export default function ApproveLocationDetail({ submissionId }: Props) {
  const role = useMobileRole()
  const [submission, setSubmission] = useState<PendingSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<Action>(null)
  const [name, setName] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchPendingSubmission(submissionId).then((data) => {
      if (!alive) return
      setSubmission(data)
      if (data?.noteFromEmployee) setName(data.noteFromEmployee)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [submissionId])

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

  if (!submission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notice}>
          <Feather name="alert-triangle" size={20} color={KAYA.errorText} />
          <Text style={styles.noticeText}>მოთხოვნა ვერ მოიძებნა.</Text>
        </View>
      </SafeAreaView>
    )
  }

  async function handleApprove() {
    setError(null)
    setBusy(true)
    try {
      await approveLocation(submission!.id, name)
      Alert.alert('დამტკიცებული', 'ლოკაცია გააქტიურდა.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'უცნობი შეცდომა')
    } finally {
      setBusy(false)
    }
  }

  async function handleReject() {
    setError(null)
    setBusy(true)
    try {
      await rejectLocation(submission!.id, reason)
      Alert.alert('უარყოფილი', 'მოთხოვნა უარყოფილ იქნა.', [
        { text: 'OK', onPress: () => router.back() },
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
          <Text style={styles.title}>მოთხოვნის განხილვა</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {submission.photoSignedUrl ? (
            <Image
              source={{ uri: submission.photoSignedUrl }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Feather name="image" size={32} color={KAYA.textTertiary} />
            </View>
          )}

          <View style={styles.employeeCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{submission.employeeInitials}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.employeeName}>{submission.employeeName}</Text>
              <Text style={styles.employeeMeta}>{relativeTime(submission.submittedAt)}</Text>
            </View>
          </View>

          <View style={styles.gpsCard}>
            <Feather name="map-pin" size={14} color={KAYA.accent} />
            <Text style={styles.gpsText}>
              {submission.latitude.toFixed(5)}, {submission.longitude.toFixed(5)}
            </Text>
            {submission.distanceToNearestM !== null && (
              <Text style={styles.gpsMeta}>უახლოესი {submission.distanceToNearestM} მ</Text>
            )}
          </View>

          {MapPreview && (
            <View style={styles.mapPreview}>
              <MapPreview
                latitude={submission.latitude}
                longitude={submission.longitude}
                radiusM={100}
              />
            </View>
          )}

          {submission.noteFromEmployee && (
            <View style={styles.noteCard}>
              <Text style={styles.noteLabel}>თანამშრომლის შენიშვნა</Text>
              <Text style={styles.noteText}>{submission.noteFromEmployee}</Text>
            </View>
          )}

          {action === 'approve' && (
            <View style={styles.field}>
              <Text style={styles.label}>საბოლოო სახელი</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="მაგ. ვაკის სუპერმარკეტი"
                placeholderTextColor={KAYA.textTertiary}
                style={styles.input}
                editable={!busy}
              />
            </View>
          )}

          {action === 'reject' && (
            <View style={styles.field}>
              <Text style={styles.label}>უარყოფის მიზეზი</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="მაგ. ფოტო არ შეესაბამება სამუშაო ადგილს"
                placeholderTextColor={KAYA.textTertiary}
                multiline
                style={[styles.input, styles.textarea]}
                editable={!busy}
              />
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Feather name="x-circle" size={14} color={KAYA.errorText} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {action === null ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => setAction('approve')}
              activeOpacity={0.85}
            >
              <Feather name="check" size={16} color="#FFF" />
              <Text style={styles.actionBtnText}>დამტკიცება</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.singleUseBtn]}
              onPress={() =>
                Alert.alert('მოგვიანებით', 'ერთჯერადი დაშვება ჯერ არ არის გათვალისწინებული.')
              }
              activeOpacity={0.85}
            >
              <Feather name="zap" size={16} color={KAYA.textPrimary} />
              <Text style={[styles.actionBtnText, { color: KAYA.textPrimary }]}>ერთჯერადი</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => setAction('reject')}
              activeOpacity={0.85}
            >
              <Feather name="x" size={16} color="#FFF" />
              <Text style={styles.actionBtnText}>უარყოფა</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.confirmRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setAction(null)
                setError(null)
              }}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelBtnText}>გაუქმება</Text>
            </TouchableOpacity>
            {action === 'approve' ? (
              <TouchableOpacity
                style={[styles.confirmBtn, styles.approveBtn, busy && { opacity: 0.6 }]}
                onPress={handleApprove}
                disabled={busy}
                activeOpacity={0.85}
              >
                {busy ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.actionBtnText}>დადასტურება</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.confirmBtn, styles.rejectBtn, busy && { opacity: 0.6 }]}
                onPress={handleReject}
                disabled={busy}
                activeOpacity={0.85}
              >
                {busy ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.actionBtnText}>უარყოფა</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function relativeTime(submittedAt: string | null) {
  if (!submittedAt) return '—'
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(submittedAt).getTime()) / 60000))
  if (minutes < 1) return 'ახლახან'
  if (minutes < 60) return `${minutes} წუთის წინ`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} საათის წინ`
  return `${Math.floor(hours / 24)} დღის წინ`
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

  scroll: { padding: 16, paddingBottom: 32, gap: 14 },

  photo: { width: '100%', aspectRatio: 1, borderRadius: 14, backgroundColor: KAYA.surface2 },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KAYA.border,
    backgroundColor: KAYA.bg,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: KAYA.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: KAYA.accent },
  employeeName: { fontSize: 15, fontWeight: '700', color: KAYA.textPrimary },
  employeeMeta: { fontSize: 12, color: KAYA.textSecondary, marginTop: 2 },

  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: KAYA.accentTint,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  gpsText: {
    fontSize: 13,
    fontWeight: '700',
    color: KAYA.accent,
    fontVariant: ['tabular-nums'],
  },
  gpsMeta: { fontSize: 11, color: KAYA.accent, fontVariant: ['tabular-nums'] },

  mapPreview: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: KAYA.border,
  },

  noteCard: {
    backgroundColor: KAYA.surface,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  noteLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: KAYA.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteText: { fontSize: 13, color: KAYA.textPrimary, lineHeight: 18 },

  field: { gap: 8 },
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
  textarea: { height: 88, paddingVertical: 10, textAlignVertical: 'top' },

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

  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: KAYA.border,
    backgroundColor: KAYA.bg,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  approveBtn: { backgroundColor: KAYA.success },
  singleUseBtn: { backgroundColor: KAYA.surface2 },
  rejectBtn: { backgroundColor: KAYA.error },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  confirmRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: KAYA.border,
    backgroundColor: KAYA.bg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: KAYA.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: KAYA.textPrimary },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notice: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  noticeText: { fontSize: 14, color: KAYA.textSecondary, textAlign: 'center' },
})
