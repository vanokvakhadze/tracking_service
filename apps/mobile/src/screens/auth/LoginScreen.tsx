import { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { loginWithPassword } from '@/src/services/auth'

const KAYA = {
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  border: '#E2E8F0',
  accent: '#1565C0',
}

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('შეცდომა', 'შეავსე ემაილი და პაროლი')
      return
    }
    setLoading(true)
    try {
      await loginWithPassword(email, password)
      // RootLayout reacts to onAuthStateChange and redirects to the (tabs) group
    } catch (err) {
      const message = err instanceof Error ? err.message : 'შესვლა ვერ მოხერხდა'
      Alert.alert('შეცდომა', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.logo}>
        <Text style={styles.logoText}>T</Text>
      </View>
      <Text style={styles.title}>TrackPro</Text>
      <Text style={styles.subtitle}>GPS-ის თანამშრომლების ტრექინგი</Text>

      <View style={styles.form}>
        <Text style={styles.label}>ემაილი</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="you@company.ge"
          placeholderTextColor={KAYA.textSecondary}
        />

        <Text style={styles.label}>პაროლი</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'იტვირთება…' : 'შესვლა'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: KAYA.bg,
    justifyContent: 'center',
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: KAYA.accent,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  logoText: { color: KAYA.bg, fontSize: 28, fontWeight: '700' },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    color: KAYA.textPrimary,
  },
  subtitle: { fontSize: 14, color: KAYA.textSecondary, textAlign: 'center', marginTop: 4 },
  form: { marginTop: 32 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: KAYA.textSecondary,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: KAYA.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    color: KAYA.textPrimary,
  },
  button: {
    backgroundColor: KAYA.accent,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: KAYA.bg, fontSize: 14, fontWeight: '600' },
})
