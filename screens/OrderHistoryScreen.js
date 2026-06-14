import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import api from '../services/api';
import Card from '../components/Card';
import OrderStatusBadge from '../components/OrderStatusBadge';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts } from '../theme';

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/orders').then(res => setOrders(res.data || [])).catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📜 My Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontWeight: '600' }}>#{item._id.slice(-6)}</Text>
              <OrderStatusBadge status={item.status} />
            </View>
            <Text style={{ fontSize: 13, color: Colors.gray600 }}>Customer: {item.customer?.name}</Text>
            <Text style={{ fontSize: 13, color: Colors.gray600 }}>Amount: ${item.payment?.amount?.toFixed(2)}</Text>
          </Card>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: Colors.gray400 }}>No orders yet</Text>}
      />
      <BottomTabBar navigation={navigation} activeScreen="Dashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  title: { fontSize: Fonts.sizes.xl, ...Fonts.bold, padding: 16, paddingTop: 50 },
});