import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  TouchableOpacity,
} from 'react-native';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
import { useActiveOrder } from '../context/ActiveOrderContext';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';
import AppButton from '../components/AppButton';
import Card from '../components/Card';
import OrderStatusBadge from '../components/OrderStatusBadge';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts, Radius, Shadows } from '../theme';

// ---------- Only load native maps outside Expo Go ----------
let MapView = null;
let Marker = null;
let Polyline = null;
if (Constants.appOwnership !== 'expo') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default || maps;
    Marker = maps.Marker || (MapView && MapView.Marker);
    Polyline = maps.Polyline || (MapView && MapView.Polyline);
  } catch (e) {
    console.warn('react-native-maps not available:', e.message);
  }
}

// ---------- Leaflet map HTML (small markers) ----------
const mapHTML = (riderLat, riderLng, dropoffLat, dropoffLng) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"></script>
    <style>
      body { margin:0; padding:0; background:#e8f5e9; }
      #map { width:100vw; height:100vh; }
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(255,127,42,0.6); }
        50% { box-shadow: 0 0 0 8px rgba(255,127,42,0); }
        100% { box-shadow: 0 0 0 0 rgba(255,127,42,0); }
      }
      .rider-pulse {
        animation: pulse 2s infinite;
        border-radius: 50%;
      }
      .dropoff-glow {
        box-shadow: 0 0 6px rgba(59,130,246,0.5);
        border-radius: 50%;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const map = L.map('map', {
        zoomControl: true,
        attributionControl: false,
      }).setView([${riderLat}, ${riderLng}], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const riderIcon = L.divIcon({
        className: 'rider-pulse',
        html: '<div style="width:28px;height:28px;background:#FF7F2A;border-radius:50%;border:1.5px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;color:white;">🏍️</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
      });

      const dropoffIcon = L.divIcon({
        className: 'dropoff-glow',
        html: '<div style="width:24px;height:24px;background:#3b82f6;border-radius:50%;border:1.5px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px;color:white;">🏠</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
      });

      const riderMarker = L.marker([${riderLat}, ${riderLng}], { icon: riderIcon })
        .addTo(map)
        .bindPopup('📍 You are here');

      const dropoffMarker = ${dropoffLat && dropoffLng
        ? `L.marker([${dropoffLat}, ${dropoffLng}], { icon: dropoffIcon }).addTo(map).bindPopup('🏠 Customer');`
        : 'null;'}

      let routeLayer = null;

      async function fetchAndDrawRoute(fromLat, fromLng, toLat, toLng) {
        if (!toLat || !toLng) return;
        try {
          const url = \`https://router.project-osrm.org/route/v1/driving/\${fromLng},\${fromLat};\${toLng},\${toLat}?overview=full&geometries=geojson\`;
          const response = await fetch(url);
          const data = await response.json();
          if (data.code === 'Ok' && data.routes.length > 0) {
            const route = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            if (routeLayer) map.removeLayer(routeLayer);
            routeLayer = L.polyline(route, {
              color: '#FF7F2A',
              weight: 3,
              opacity: 0.9,
              dashArray: '8 6',
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(map);
            map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
            return;
          }
        } catch (e) {}
        if (routeLayer) map.removeLayer(routeLayer);
        routeLayer = L.polyline([[fromLat, fromLng], [toLat, toLng]], {
          color: '#FF7F2A',
          weight: 2,
          opacity: 0.7,
          dashArray: '6 6',
          lineCap: 'round'
        }).addTo(map);
        map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
      }

      fetchAndDrawRoute(${riderLat}, ${riderLng}, ${dropoffLat || 0}, ${dropoffLng || 0});

      window.updateRiderLocation = function(lat, lng) {
        riderMarker.setLatLng([lat, lng]);
        fetchAndDrawRoute(lat, lng, ${dropoffLat || 0}, ${dropoffLng || 0});
        map.setView([lat, lng], 15);
      };
    </script>
  </body>
  </html>
`;

export default function OrderAssignedScreen({ navigation, route }) {
  const { activeOrder: contextOrder, updateOrderStatus } = useActiveOrder();
  const { rider } = useAuth();
  const [currentOrder, setCurrentOrder] = useState(route?.params?.order || contextOrder);
  const [riderLocation, setRiderLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [loading, setLoading] = useState(false);
  const webViewRef = useRef(null);

  useEffect(() => { if (contextOrder) setCurrentOrder(contextOrder); }, [contextOrder]);

  // Get rider's current location
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            pos => setRiderLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => {}
          );
        }
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setRiderLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    })();
  }, []);

  // Update WebView when riderLocation changes
  useEffect(() => {
    if (webViewRef.current && riderLocation) {
      webViewRef.current.injectJavaScript(`
        window.updateRiderLocation(${riderLocation.latitude}, ${riderLocation.longitude});
      `);
    }
  }, [riderLocation]);

  // Fetch road route for native map (OSRM)
  useEffect(() => {
    const dropoffLat = currentOrder?.deliveryAddress?.lat;
    const dropoffLng = currentOrder?.deliveryAddress?.lng;
    if (!riderLocation || !dropoffLat || !dropoffLng) return;
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${riderLocation.longitude},${riderLocation.latitude};${dropoffLng},${dropoffLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.code === 'Ok' && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(c => ({
            latitude: c[1],
            longitude: c[0],
          }));
          setRouteCoords(coords);
        } else {
          setRouteCoords([
            riderLocation,
            { latitude: dropoffLat, longitude: dropoffLng },
          ]);
        }
      } catch {
        setRouteCoords([
          riderLocation,
          { latitude: dropoffLat, longitude: dropoffLng },
        ]);
      }
    };
    fetchRoute();
  }, [riderLocation, currentOrder?.deliveryAddress]);

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    try {
      await updateOrderStatus(currentOrder._id, newStatus, '', riderLocation);
      Alert.alert('Success', `Order marked as ${newStatus.replace(/_/g, ' ')}`);
      if (newStatus === 'delivered') navigation.navigate('Dashboard');
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Update failed'); }
    finally { setLoading(false); }
  };

  // ---------- Google Maps Navigation ----------
  const openGoogleMaps = () => {
    const dropoffLat = currentOrder?.deliveryAddress?.lat;
    const dropoffLng = currentOrder?.deliveryAddress?.lng;
    if (!riderLocation || !dropoffLat || !dropoffLng) {
      Alert.alert('Navigation unavailable', 'Missing location coordinates.');
      return;
    }
    const origin = `${riderLocation.latitude},${riderLocation.longitude}`;
    const destination = `${dropoffLat},${dropoffLng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open Google Maps. Please install the app.')
    );
  };

  if (!currentOrder) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>No active order</Text></View>;

  const isAssignedRider = String(currentOrder.rider) === String(rider?._id);
  const dropoffLat = currentOrder.deliveryAddress?.lat;
  const dropoffLng = currentOrder.deliveryAddress?.lng;
  const mapLat = riderLocation?.latitude || 31.72;
  const mapLng = riderLocation?.longitude || 72.98;

  return (
    <View style={styles.container}>
      {/* ---- Map ---- */}
      {MapView ? (
        <MapView
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: mapLat,
            longitude: mapLng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={false}
          toolbarEnabled={false}
        >
          {riderLocation && (
            <Marker coordinate={riderLocation} title="You are here">
              <View style={styles.riderMarkerBox}>
                <Text style={styles.riderMarkerIcon}>🏍️</Text>
              </View>
            </Marker>
          )}
          {dropoffLat && dropoffLng && (
            <Marker coordinate={{ latitude: dropoffLat, longitude: dropoffLng }} title="Customer">
              <View style={styles.dropoffMarkerBox}>
                <Text style={styles.dropoffMarkerIcon}>🏠</Text>
              </View>
            </Marker>
          )}
          {routeCoords.length > 1 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#FF7F2A"
              strokeWidth={3}
              lineDashPattern={[6, 4]}
            />
          )}
        </MapView>
      ) : (
        <View style={StyleSheet.absoluteFillObject}>
          <WebView
            ref={webViewRef}
            source={{ html: mapHTML(mapLat, mapLng, dropoffLat, dropoffLng) }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Bottom card with order details and actions */}
      <View style={styles.orderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontWeight: '700', fontSize: Fonts.sizes.lg }}>#{currentOrder._id.slice(-6)}</Text>
          <OrderStatusBadge status={currentOrder.status} />
        </View>
        <Text style={styles.detailText}>Customer: {currentOrder.customer?.name}</Text>

        {/* ---------- Pickup Stops / Wholesaler Groups ---------- */}
        {currentOrder.wholesalerGroups?.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>🛍️ Pickup Stops</Text>
            {currentOrder.wholesalerGroups.map((group, idx) => (
              <View key={idx} style={styles.groupBox}>
                <Text style={styles.groupStore}>
                  {group.storeName || group.wholesaler?.storeName || group.wholesaler?.name || 'Store'}
                </Text>
                <Text style={styles.groupStatus}>
                  Status: {group.status === 'ready_for_pickup' ? '✅ Ready' : '⏳ Packing'}
                </Text>
                {group.items?.map((item, i) => (
                  <Text key={i} style={styles.groupItem}>
                    • {item.product?.name || 'Product'} x{item.quantity} – Rs. {item.price * item.quantity}
                  </Text>
                ))}
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.detailText}>
            Pickup: {currentOrder.wholesaler?.storeName || currentOrder.wholesaler?.name || 'Store'}
          </Text>
        )}

        <Text style={styles.detailText}>Dropoff: {currentOrder.deliveryAddress?.street}, {currentOrder.deliveryAddress?.city}</Text>
        <Text style={{ fontWeight: '600', marginTop: 8 }}>Amount: Rs. {currentOrder.payment?.amount?.toFixed(2)}</Text>

        {/* ---- Google Maps Navigation Button ---- */}
        {riderLocation && dropoffLat && dropoffLng && (
          <TouchableOpacity style={styles.googleMapsButton} onPress={openGoogleMaps}>
            <Text style={styles.googleMapsText}>🗺️ Navigate with Google Maps</Text>
          </TouchableOpacity>
        )}

        <View style={{ marginTop: 16 }}>
          {currentOrder.status === 'confirmed' && isAssignedRider && (
            <AppButton
              title="🚀 Pickup (Skip Packing)"
              onPress={() => handleStatusUpdate('out_for_delivery')}
              loading={loading}
            />
          )}
          {(currentOrder.status === 'confirmed' || currentOrder.status === 'packing') && !isAssignedRider && (
            <Card accent={Colors.amber} style={{ backgroundColor: '#fff3e0' }}>
              <Text style={{ color: '#e65100', fontWeight: '600', textAlign: 'center' }}>
                ⏳ Waiting for wholesaler to pack...
              </Text>
            </Card>
          )}
          {currentOrder.status === 'packing' && isAssignedRider && (
            <Card accent={Colors.amber} style={{ backgroundColor: '#fff3e0' }}>
              <Text style={{ color: '#e65100', fontWeight: '600', textAlign: 'center' }}>
                ⏳ Wholesaler is packing...
              </Text>
            </Card>
          )}
          {currentOrder.status === 'ready_for_pickup' && isAssignedRider && (
            <AppButton title="📦 Pickup & Start Delivery" onPress={() => handleStatusUpdate('out_for_delivery')} loading={loading} />
          )}
          {currentOrder.status === 'out_for_delivery' && (
            <AppButton title="✅ Mark Delivered" onPress={() => handleStatusUpdate('delivered')} loading={loading} />
          )}
        </View>
      </View>

      <BottomTabBar navigation={navigation} activeScreen="OrderAssigned" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  orderCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    ...Shadows.md,
  },
  detailText: { fontSize: 13, color: Colors.gray600, marginBottom: 4 },
  sectionTitle: { fontWeight: '700', fontSize: 16, marginTop: 12, marginBottom: 8, color: '#1f2937' },
  groupBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  groupStore: { fontWeight: '700', fontSize: 14, color: '#FF7F2A' },
  groupStatus: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  groupItem: { fontSize: 13, color: '#374151', marginLeft: 8 },
  // Small rider marker (28x28)
  riderMarkerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    backgroundColor: '#FF7F2A',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  riderMarkerIcon: { fontSize: 14 },
  // Small dropoff marker (24x24)
  dropoffMarkerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  dropoffMarkerIcon: { fontSize: 12 },
  googleMapsButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  googleMapsText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});