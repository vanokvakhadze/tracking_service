import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function AdminTeam() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.center}>
        <Text style={styles.title}>გუნდი</Text>
        <Text style={styles.muted}>Phase 4 Task 4.4 — Team List placeholder</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  muted: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
})
