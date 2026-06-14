import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const LiveMap = ({ region, markers }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webPlaceholder}>
        <Text style={styles.placeholderText}>🗺️ Live Map</Text>
        <Text style={styles.subText}>Markers: {markers?.length || 0} | Centre: {region?.latitude || 'N/A'}</Text>
      </View>
    );
  }

  const MapView = require('react-native-maps').default;
  const { Marker } = require('react-native-maps');
  return (
    <MapView
      style={styles.map}
      region={region || { latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
    >
      {markers?.map((m, i) => (
        <Marker key={i} coordinate={m.coordinate} title={m.title} />
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: { flex: 1 },
  webPlaceholder: {
    flex: 1, backgroundColor: '#e0f2f1', justifyContent: 'center', alignItems: 'center',
    borderRadius: 12, margin: 12,
  },
  placeholderText: { fontSize: 28, fontWeight: 'bold', color: '#00695C' },
  subText: { marginTop: 8, color: '#555' },
});

export default LiveMap;
