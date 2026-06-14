import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useActiveOrder } from '../context/ActiveOrderContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import useLocationTracking from '../hooks/useLocationTracking';
import AppButton from '../components/AppButton';
import Card from '../components/Card';
import ToggleSwitch from '../components/ToggleSwitch';
import OrderStatusBadge from '../components/OrderStatusBadge';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts, Shadows, Radius } from '../theme';

export default function DashboardScreen({ navigation }) {
  const { rider, logout } = useAuth();
  const { isOnline, goOnline, goOffline, activeOrder, fetchAvailableOrders, availableOrders } = useActiveOrder();
  useLocationTracking(true);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, deliveries: 0, rating: 5.0, acceptance: 94 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try { const { data } = await api.get('/rider/dashboard'); if (data) setStats(prev => ({ ...prev, today: data.todayEarnings || 0, week: data.weekEarnings || 0, month: data.monthEarnings || 0, deliveries: data.totalDeliveries || 0, rating: data.rating || 5.0 })); } catch (e) { }
  };

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchStats(); await fetchAvailableOrders(); setRefreshing(false); };

  const toggleOnline = () => { if (isOnline) goOffline(); else goOnline(); };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Logout', style: 'destructive', onPress: async () => { await AsyncStorage.clear(); if (typeof window !== 'undefined') window.location.reload(); else navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); } }]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }} // space for bottom tab bar
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{(rider?.name || 'R')[0].toUpperCase()}</Text></View>
            <View>
              <Text style={styles.greeting}>Hello, {rider?.name?.split(' ')[0] || 'Rider'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: Colors.amber, fontSize: 12 }}>⭐ {stats.rating}</Text>
                <Text style={{ color: Colors.gray400, fontSize: 12 }}>· {stats.deliveries} deliveries</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: isOnline ? Colors.primary600 : Colors.gray400 }}>{isOnline ? 'Online' : 'Offline'}</Text>
            <ToggleSwitch value={isOnline} onToggle={toggleOnline} />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: Colors.primary50 }]}><Text style={styles.statIcon}>💰</Text><Text style={styles.statValue}>${stats.today.toFixed(2)}</Text><Text style={styles.statLabel}>Today</Text></View>
          <View style={[styles.statCard, { backgroundColor: Colors.blue50 }]}><Text style={styles.statIcon}>📦</Text><Text style={styles.statValue}>{stats.deliveries}</Text><Text style={styles.statLabel}>Completed</Text></View>
          <View style={[styles.statCard, { backgroundColor: Colors.amber50 }]}><Text style={styles.statIcon}>⏱️</Text><Text style={styles.statValue}>22 min</Text><Text style={styles.statLabel}>Avg Time</Text></View>
          <View style={[styles.statCard, { backgroundColor: Colors.purple50 }]}><Text style={styles.statIcon}>🎯</Text><Text style={styles.statValue}>{stats.acceptance}%</Text><Text style={styles.statLabel}>Acceptance</Text></View>
        </View>

        {/* Available Orders */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 2 }}>
          <Text style={{ fontSize: Fonts.sizes.lg, ...Fonts.bold, color: Colors.gray900 }}>🆕 Available Orders</Text>
          <Text style={{ color: Colors.primary600, fontWeight: '600', fontSize: 13 }} onPress={() => navigation.navigate('Waiting')}>View all →</Text>
        </View>
        {availableOrders.length === 0 ? (
          <Card style={{ alignItems: 'center', padding: 30 }}>
            <Text style={{ fontSize: 40, opacity: 0.6 }}>📭</Text>
            <Text style={{ fontSize: Fonts.sizes.md, color: Colors.gray600, marginTop: 8 }}>No orders nearby</Text>
            <Text style={{ fontSize: Fonts.sizes.sm, color: Colors.gray400, marginTop: 4 }}>New orders will appear here</Text>
          </Card>
        ) : (
          availableOrders.slice(0, 3).map(order => (
            <Card key={order._id} onPress={() => navigation.navigate('OrderAssigned', { order })} accent={Colors.primary600}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontWeight: '700' }}>#{order._id.slice(-6)}</Text>
                <OrderStatusBadge status={order.status} />
              </View>
              <Text style={{ fontSize: 13, color: Colors.gray600, marginBottom: 4 }}>📍 {order.pickup?.split(',')[0] || order.wholesaler?.storeName}</Text>
              <Text style={{ fontSize: 13, color: Colors.gray600, marginBottom: 8 }}>🏠 {order.dropoff?.split(',')[0] || order.deliveryAddress?.street}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: Colors.primary600 }}>${order.payment?.amount?.toFixed(2)}</Text>
                <AppButton title="Accept" size="sm" onPress={() => navigation.navigate('OrderAssigned', { order })} />
              </View>
            </Card>
          ))
        )}

        {/* Active Order */}
        {activeOrder && (
          <Card accent={Colors.amber} onPress={() => navigation.navigate('OrderAssigned', { order: activeOrder })} style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontWeight: '700' }}>#{activeOrder._id.slice(-6)}</Text>
              <OrderStatusBadge status={activeOrder.status} />
            </View>
            <Text style={{ fontSize: 13, color: Colors.gray600, marginBottom: 4 }}>📍 Pickup: {activeOrder.wholesaler?.storeName || 'Store'}</Text>
            <Text style={{ fontSize: 13, color: Colors.gray600, marginBottom: 8 }}>🏠 Dropoff: {activeOrder.deliveryAddress?.street}</Text>
            <AppButton title="Continue Current Order" onPress={() => navigation.navigate('OrderAssigned', { order: activeOrder })} />
          </Card>
        )}

        {/* Removed Quick Actions – now in bottom tab bar */}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <BottomTabBar navigation={navigation} activeScreen="Dashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 4 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primary600, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  greeting: { fontSize: Fonts.sizes.lg, ...Fonts.bold, color: Colors.gray900 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: Radius.lg, padding: 14, alignItems: 'flex-start' },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statValue: { fontSize: Fonts.sizes.lg, ...Fonts.bold, color: Colors.gray900 },
  statLabel: { fontSize: Fonts.sizes.xs, color: Colors.gray400 },
});