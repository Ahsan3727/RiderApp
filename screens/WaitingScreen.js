import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { useActiveOrder } from '../context/ActiveOrderContext';
import AppButton from '../components/AppButton';
import Card from '../components/Card';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { Colors, Fonts } from '../theme';
import BottomTabBar from '../components/BottomTabBar';
export default function WaitingScreen({ navigation }) {
  const { availableOrders, fetchAvailableOrders, acceptOrder } = useActiveOrder();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchAvailableOrders(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchAvailableOrders(); setRefreshing(false); };

  const handleAccept = async (orderId) => {
    try {
      const order = await acceptOrder(orderId);
      Alert.alert('Accepted', 'Order accepted!', [{ text: 'OK', onPress: () => navigation.navigate('OrderAssigned', { order }) }]);
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Could not accept'); }
  };

  const renderItem = ({ item }) => (
    <Card onPress={() => handleAccept(item._id)}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontWeight: '700' }}>#{item._id.slice(-6)}</Text>
        <OrderStatusBadge status={item.status} />
      </View>
      <Text style={styles.pickup}>📍 {item.pickup?.split(',')[0] || item.wholesaler?.storeName}</Text>
      <Text style={styles.dropoff}>🏠 {item.dropoff?.split(',')[0] || item.deliveryAddress?.street}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: '700', color: Colors.primary600 }}>${item.payment?.amount?.toFixed(2)}</Text>
        <AppButton title="Accept" size="sm" onPress={() => handleAccept(item._id)} />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppButton title="← Back" type="ghost" size="sm" onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Available Orders</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={availableOrders}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 40 }}><Text style={{ fontSize: 40 }}>📭</Text><Text style={{ color: Colors.gray400, marginTop: 8 }}>No available orders</Text></View>}
      />
      <BottomTabBar navigation={navigation} activeScreen="Waiting" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 8, paddingBottom: 10 },
  title: { fontSize: Fonts.sizes.xl, ...Fonts.bold },
  pickup: { fontSize: 13, color: Colors.gray600, marginBottom: 4 },
  dropoff: { fontSize: 13, color: Colors.gray600, marginBottom: 8 },
});