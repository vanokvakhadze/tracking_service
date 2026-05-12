import { type Href, router } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const KAYA = {
  bg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  accent: '#1565C0',
  surface: '#F8FAFC',
}

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>T</Text>
        </View>
        <Text style={styles.title}>კეთილი იყოს თქვენი მობრძანება</Text>
        <Text style={styles.subtitle}>
          TrackPro აჩვენებს, სად ხართ ცვლის დროს — და მხოლოდ მაშინ.
        </Text>

        <View style={styles.points}>
          <Point label="ცვლა ავტომატურად იწყება როცა სამუშაო წერტილზე მიხვალთ" />
          <Point label="ცვლის გარეთ GPS იღება — თქვენი დრო თქვენი დროა" />
          <Point label="აღრიცხული მონაცემები მხოლოდ თქვენი დამქირავებლისთვის" />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/permissions' as unknown as Href)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>გავაგრძელო</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function Point({ label }: { label: string }) {
  return (
    <View style={styles.point}>
      <View style={styles.dot} />
      <Text style={styles.pointText}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KAYA.bg, justifyContent: 'space-between' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: KAYA.accent,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  logoText: { color: KAYA.bg, fontSize: 28, fontWeight: '700' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: KAYA.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: KAYA.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 36,
  },
  points: { gap: 16 },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: KAYA.accent, marginTop: 7 },
  pointText: { flex: 1, fontSize: 13, color: KAYA.textPrimary, lineHeight: 19 },
  footer: { padding: 24 },
  button: {
    backgroundColor: KAYA.accent,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: KAYA.bg, fontSize: 14, fontWeight: '600' },
})
