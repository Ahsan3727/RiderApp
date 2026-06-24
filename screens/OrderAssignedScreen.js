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
  ScrollView,
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

// Always use WebView map – no native maps needed
const MapView = null;
const Marker = null;
const Polyline = null;

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

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    try {
      await updateOrderStatus(currentOrder._id, newStatus, '', riderLocation);
      Alert.alert('Success', `Order marked as ${newStatus.replace(/_/g, ' ')}`);
      if (newStatus === 'delivered') navigation.navigate('Dashboard');
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Update failed'); }
    finally { setLoading(false); }
  };

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
      Alert.alert('Error', 'Could not open Google Maps.')
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
      {/* ---- Map (always WebView) ---- */}
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

      {/* Bottom card with full order details */}
      <View style={styles.bottomSheet}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Order ID & Status */}
          <View style={styles.rowBetween}>
            <Text style={styles.orderId}>Order #{currentOrder._id.slice(-6)}</Text>
            <OrderStatusBadge status={currentOrder.status} />
          </View>

          {/* Customer */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>{currentOrder.customer?.name || 'N/A'}</Text>
          </View>

          {/* Pickup Stops (wholesaler groups or single) */}
          {currentOrder.wholesalerGroups?.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🛍️ Pickup Stops</Text>
              {currentOrder.wholesalerGroups.map((group, idx) => (
                <View key={idx} style={styles.groupBox}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.groupStore}>
                      {group.storeName || group.wholesaler?.storeName || group.wholesaler?.name || 'Store'}
                    </Text>
                    <Text style={[styles.groupStatus, group.status === 'ready_for_pickup' && styles.statusReady]}>
                      {group.status === 'ready_for_pickup' ? '✅ Ready' : '⏳ Packing'}
                    </Text>
                  </View>

                  {/* Group items */}
                  <View style={styles.itemsTable}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderText, { flex: 2 }]}>Item</Text>
                      <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                      <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Price</Text>
                    </View>
                    {group.items?.map((item, i) => (
                      <View key={i} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 2 }]}>{item.product?.name || 'Product'}</Text>
                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>x{item.quantity}</Text>
                        <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>Rs. {item.price * item.quantity}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Pickup</Text>
              <Text style={styles.value}>
                {currentOrder.wholesaler?.storeName || currentOrder.wholesaler?.name || 'Store'}
              </Text>
            </View>
          )}

          {/* Dropoff */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Dropoff</Text>
            <Text style={styles.value}>
              {currentOrder.deliveryAddress?.street}, {currentOrder.deliveryAddress?.city}
            </Text>
          </View>

          {/* Amount & Payment Method */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.valueBold}>
              Rs. {currentOrder.payment?.amount?.toFixed(2)} ({currentOrder.payment?.method?.toUpperCase() || 'COD'})
            </Text>
          </View>

          {/* Google Maps Navigation */}
          {riderLocation && dropoffLat && dropoffLng && (
            <TouchableOpacity style={styles.googleMapsButton} onPress={openGoogleMaps}>
              <Text style={styles.googleMapsText}>🗺️ Navigate with Google Maps</Text>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
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
              <AppButton
                title="📦 Pickup & Start Delivery"
                onPress={() => handleStatusUpdate('out_for_delivery')}
                loading={loading}
              />
            )}
            {currentOrder.status === 'out_for_delivery' && (
              <AppButton
                title="✅ Mark Delivered"
                onPress={() => handleStatusUpdate('delivered')}
                loading={loading}
              />
            )}
          </View>
        </ScrollView>
      </View>

      <BottomTabBar navigation={navigation} activeScreen="OrderAssigned" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  bottomSheet: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    maxHeight: '55%',               // allows map visibility
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Shadows.md,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontWeight: '700',
    fontSize: 18,
    color: Colors.gray900,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: Colors.gray600,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: Colors.gray900,
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: '60%',
  },
  valueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 10,
    color: '#1f2937',
  },
  groupBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  groupStore: {
    fontWeight: '700',
    fontSize: 15,
    color: '#FF7F2A',
    marginBottom: 4,
  },
  groupStatus: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusReady: {
    color: '#16a34a',
  },
  itemsTable: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  tableCell: {
    fontSize: 13,
    color: '#374151',
  },
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
  actions: {
    marginTop: 20,
  },
});