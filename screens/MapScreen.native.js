import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function MapScreen({ navigation }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mapRef = useRef(null);
  const locationSubscription = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (isMounted) {
          setPermissionDenied(true);
          setLoading(false);
        }
        return;
      }

      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (isMounted) setCurrentLocation(loc.coords);
      } catch (error) {
        console.error('Initial location error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 5,
        },
        (newLoc) => {
          if (isMounted) setCurrentLocation(newLoc.coords);
        }
      );
    };

    init();

    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const centerOnUser = () => {
    if (mapRef.current && currentLocation) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.statusText}>Getting location...</Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={styles.centered}>
        <Text style={styles.deniedTitle}>Location Permission Required</Text>
        <Text style={styles.deniedMessage}>Please enable location in your device settings.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={() => Linking.openSettings()}>
          <Text style={styles.permissionBtnText}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation?.latitude || 0,
          longitude: currentLocation?.longitude || 0,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        toolbarEnabled={false}
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="You are here"
          >
            <View style={styles.markerBox}>
              <Text style={styles.markerIcon}>🛵</Text>
            </View>
          </Marker>
        )}
      </MapView>

      <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser}>
        <Text style={styles.centerBtnIcon}>📍</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Location</Text>
        <View style={{ width: 50 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#fff' },
  statusText: { marginTop: 12, fontSize: 16, color: '#666' },
  deniedTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  deniedMessage: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 20 },
  permissionBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginBottom: 15 },
  permissionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backLink: { color: '#4CAF50', fontWeight: '600', fontSize: 16, marginTop: 10 },
  header: {
    position: 'absolute', top: 50, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.95)',
  },
  backBtn: { fontSize: 16, color: '#4CAF50', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  markerBox: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40 },
  markerIcon: { fontSize: 28 },
  centerBtn: {
    position: 'absolute', bottom: 30, right: 20,
    backgroundColor: 'white', borderRadius: 30, width: 50, height: 50,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  centerBtnIcon: { fontSize: 24 },
});