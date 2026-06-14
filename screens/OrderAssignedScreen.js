import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { useActiveOrder } from '../context/ActiveOrderContext';
import * as Location from 'expo-location';
import AppButton from '../components/AppButton';
import Card from '../components/Card';
import OrderStatusBadge from '../components/OrderStatusBadge';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts, Radius, Shadows } from '../theme';

export default function OrderAssignedScreen({ navigation, route }) {
  const { activeOrder: contextOrder, updateOrderStatus } = useActiveOrder();
  const [currentOrder, setCurrentOrder] = useState(route?.params?.order || contextOrder);
  const [riderLocation, setRiderLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (contextOrder) setCurrentOrder(contextOrder); }, [contextOrder]);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        if (navigator.geolocation) navigator.geolocation.getCurrentPosition(pos => setRiderLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }), () => {});
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') { const loc = await Location.getCurrentPositionAsync({}); setRiderLocation(loc.coords); }
    })();
  }, []);

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    try {
      await updateOrderStatus(currentOrder._id, newStatus, '', riderLocation);
      Alert.alert('Success', `Order marked as ${newStatus.replace(/_/g, ' ')}`);
      if (newStatus === 'delivered') navigation.navigate('Dashboard');
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Update failed'); }
    finally { setLoading(false); }
  };

  if (!currentOrder) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>No active order</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={{ fontSize: 40 }}>🗺️</Text>
        <Text style={{ color: Colors.gray400 }}>Live Map</Text>
      </View>

      <View style={styles.orderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontWeight: '700', fontSize: Fonts.sizes.lg }}>#{currentOrder._id.slice(-6)}</Text>
          <OrderStatusBadge status={currentOrder.status} />
        </View>
        <Text style={styles.detailText}>Customer: {currentOrder.customer?.name}</Text>
        <Text style={styles.detailText}>Pickup: {currentOrder.wholesaler?.storeName || currentOrder.wholesaler?.name}</Text>
        <Text style={styles.detailText}>Dropoff: {currentOrder.deliveryAddress?.street}, {currentOrder.deliveryAddress?.city}</Text>
        <Text style={{ fontWeight: '600', marginTop: 8 }}>Amount: ${currentOrder.payment?.amount?.toFixed(2)}</Text>

        <View style={{ marginTop: 16 }}>
          {(currentOrder.status === 'confirmed' || currentOrder.status === 'packing') && (
            <Card accent={Colors.amber} style={{ backgroundColor: '#fff3e0' }}>
              <Text style={{ color: '#e65100', fontWeight: '600', textAlign: 'center' }}>⏳ Waiting for wholesaler to pack...</Text>
            </Card>
          )}
          {currentOrder.status === 'ready_for_pickup' && (
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
  mapPlaceholder: { height: 200, backgroundColor: '#e8f5e9', borderRadius: Radius.lg, margin: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.gray200 },
  orderCard: { backgroundColor: Colors.white, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, position: 'absolute', bottom: 70, left: 0, right: 0, ...Shadows.md },
  detailText: { fontSize: 13, color: Colors.gray600, marginBottom: 4 },
});