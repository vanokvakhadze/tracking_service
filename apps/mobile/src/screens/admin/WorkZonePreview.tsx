import { StyleSheet, View } from 'react-native'
import MapView, { Circle, Marker, type Region } from 'react-native-maps'

interface Props {
  latitude: number
  longitude: number
  triggerRadiusM: number
  boundaryRadiusM: number
}

const KAYA_ACCENT = '#1565C0'
const KAYA_WARNING = '#CA8A04'

export default function WorkZonePreview({
  latitude,
  longitude,
  triggerRadiusM,
  boundaryRadiusM,
}: Props) {
  const span = Math.max(boundaryRadiusM / 50000, 0.005)
  const region: Region = {
    latitude,
    longitude,
    latitudeDelta: span,
    longitudeDelta: span,
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
        <Circle
          center={{ latitude, longitude }}
          radius={boundaryRadiusM}
          strokeColor={KAYA_WARNING}
          strokeWidth={2}
          fillColor="rgba(202,138,4,0.10)"
        />
        <Circle
          center={{ latitude, longitude }}
          radius={triggerRadiusM}
          strokeColor={KAYA_ACCENT}
          strokeWidth={2}
          fillColor="rgba(21,101,192,0.18)"
        />
        <Marker coordinate={{ latitude, longitude }} />
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
