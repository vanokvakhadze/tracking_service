import { StyleSheet, View } from 'react-native'
import MapView, { Circle, Marker, type Region } from 'react-native-maps'

interface Props {
  latitude: number
  longitude: number
  radiusM: number
}

const KAYA_ACCENT = '#1565C0'

export default function CreateLocationMapPreview({ latitude, longitude, radiusM }: Props) {
  const region: Region = {
    latitude,
    longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }
  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <Marker coordinate={{ latitude, longitude }} />
        <Circle
          center={{ latitude, longitude }}
          radius={radiusM}
          strokeColor={KAYA_ACCENT}
          strokeWidth={2}
          fillColor="rgba(21,101,192,0.15)"
        />
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
