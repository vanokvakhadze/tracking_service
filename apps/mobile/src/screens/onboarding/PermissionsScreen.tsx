import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import { useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useOnboarding } from '@/src/hooks/use-onboarding'

const KAYA = {
  bg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  accent: '#1565C0',
  success: '#16A34A',
  surface: '#F8FAFC',
}

type Status = 'idle' | 'granted' | 'denied'

export default function PermissionsScreen() {
  const setOnboarded = useOnboarding((s) => s.setOnboarded)
  const [locationStatus, setLocationStatus] = useState<Status>('idle')
  const [notifStatus, setNotifStatus] = useState<Status>('idle')
  const [busy, setBusy] = useState(false)

  async function requestLocation() {
    setBusy(true)
    try {
      const fg = await Location.requestForegroundPermissionsAsync()
      if (fg.status !== 'granted') {
        setLocationStatus('denied')
        return
      }
      // Always permission needed for background geofencing later (Phase 3 SDK)
      const bg = await Location.requestBackgroundPermissionsAsync()
      setLocationStatus(bg.status === 'granted' ? 'granted' : 'denied')
    } catch {
      setLocationStatus('denied')
    } finally {
      setBusy(false)
    }
  }

  async function requestNotifications() {
    setBusy(true)
    try {
      const { status } = await Notifications.requestPermissionsAsync()
      setNotifStatus(status === 'granted' ? 'granted' : 'denied')
    } catch {
      setNotifStatus('denied')
    } finally {
      setBusy(false)
    }
  }

  function finish() {
    if (locationStatus !== 'granted') {
      Alert.alert(
        'ლოკაცია სავალდებულოა',
        'TrackPro-ს მუშაობა შესაძლებელია მხოლოდ ლოკაციის წვდომით. გადადი პარამეტრებში და ჩართე.',
      )
      return
    }
    // setOnboarded flips the Stack.Protected guard in _layout.tsx and
    // expo-router auto-navigates to the tabs group. Explicit router.replace
    // here used to race the guard change and surfaced 'Unmatched Route'.
    setOnboarded(true)
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>ნებართვები</Text>
        <Text style={styles.subtitle}>ცვლის ავტომატური დაწყებისთვის ორი ნებართვა გვჭირდება.</Text>

        <PermissionCard
          title="ლოკაცია (ყოველთვის)"
          description="საჭიროა ცვლის ავტომატური დაწყებისთვის. ცვლის გარეთ პოზიცია არ იწერება."
          status={locationStatus}
          onPress={requestLocation}
          required
        />

        <PermissionCard
          title="შეტყობინებები"
          description="როცა ცვლა იწყება / დასრულდება, ალერტი მიიღე."
          status={notifStatus}
          onPress={requestNotifications}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={finish}
          disabled={busy}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>დასრულება</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

interface PermissionCardProps {
  title: string
  description: string
  status: Status
  onPress: () => void
  required?: boolean
}

function PermissionCard({ title, description, status, onPress, required }: PermissionCardProps) {
  const isGranted = status === 'granted'
  return (
    <TouchableOpacity
      style={[styles.card, isGranted && styles.cardGranted]}
      onPress={onPress}
      disabled={isGranted}
      activeOpacity={0.7}
    >
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>{title}</Text>
        {required && <Text style={styles.required}>სავალდებულო</Text>}
      </View>
      <Text style={styles.cardDesc}>{description}</Text>
      <Text style={[styles.cardCta, isGranted && styles.cardCtaGranted]}>
        {isGranted ? '✓ ნებართულია' : status === 'denied' ? 'ხელახლა სცადე' : 'ნებართვის თხოვნა'}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KAYA.bg, justifyContent: 'space-between' },
  content: { padding: 24, paddingTop: 60, gap: 16 },
  title: { fontSize: 24, fontWeight: '700', color: KAYA.textPrimary },
  subtitle: { fontSize: 14, color: KAYA.textSecondary, lineHeight: 20, marginBottom: 12 },
  card: {
    borderWidth: 1,
    borderColor: KAYA.border,
    borderRadius: 10,
    padding: 16,
    backgroundColor: KAYA.bg,
    gap: 6,
  },
  cardGranted: { backgroundColor: KAYA.surface, borderColor: KAYA.success },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: KAYA.textPrimary },
  required: {
    fontSize: 10,
    fontWeight: '600',
    color: KAYA.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardDesc: { fontSize: 12, color: KAYA.textSecondary, lineHeight: 17 },
  cardCta: { fontSize: 12, fontWeight: '600', color: KAYA.accent, marginTop: 8 },
  cardCtaGranted: { color: KAYA.success },
  footer: { padding: 24 },
  button: {
    backgroundColor: KAYA.accent,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: KAYA.bg, fontSize: 14, fontWeight: '600' },
})
