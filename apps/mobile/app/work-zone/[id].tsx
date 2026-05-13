import WorkZoneScreen from '@/src/screens/admin/WorkZoneScreen'
import { useLocalSearchParams } from 'expo-router'
import { Text, View } from 'react-native'

export default function WorkZoneRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  if (!id || typeof id !== 'string') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#475569' }}>არასწორი ლოკაცია.</Text>
      </View>
    )
  }
  return <WorkZoneScreen locationId={id} />
}
