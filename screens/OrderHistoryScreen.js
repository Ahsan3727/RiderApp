import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Constants from 'expo-constants';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts, Radius, Shadows } from '../theme';

const OrderHistoryScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'today' | 'week'

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders'); // rider role automatically scoped by backend
      const delivered = (Array.isArray(data) ? data : []).filter(o => o.status === 'delivered');
      setOrders(delivered);
    } catch (err) {
      console.error('Error fetching order history', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getFilteredOrders = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // start of week (Sunday)

    if (filter === 'today') {
      return orders.filter(o => new Date(o.createdAt) >= todayStart);
    }
    if (filter === 'week') {
      return orders.filter(o => new Date(o.createdAt) >= weekStart);
    }
    return orders; // all
  };

  const renderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item._id.slice(-6)}</Text>
        <Text style={styles.orderDate}>
          {new Date(item.createdAt).toLocaleDateString('en-PK', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </View>
      <Text style={styles.customer}>Customer: {item.customer?.name || 'N/A'}</Text>
      <Text style={styles.amount}>Total: Rs. {item.payment?.amount?.toFixed(2)}</Text>
      <View style={styles.footerRow}>
        <Text style={styles.codBadge}>
          {item.payment?.method === 'cod' ? 'COD' : 'Online'}
        </Text>
        <Text style={[styles.settledBadge, item.riderSettled && styles.settledBadgeGreen]}>
          {item.riderSettled ? '✅ Settled' : '⏳ Pending'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter buttons */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'All' },
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'This Week' },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Order list */}
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary600} />
        </View>
      ) : (
        <FlatList
          data={getFilteredOrders()}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ fontSize: 40, opacity: 0.5 }}>📭</Text>
              <Text style={{ color: Colors.gray400, marginTop: 8 }}>No delivered orders yet</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      <BottomTabBar navigation={navigation} activeScreen="OrderHistory" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Constants.statusBarHeight + 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.primary600,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Shadows.sm,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, color: '#FFFFFF', fontWeight: '600' },
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: '#FFFFFF' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  filterChipActive: {
    backgroundColor: Colors.primary600,
    borderColor: Colors.primary600,
  },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.gray600 },
  filterTextActive: { color: '#FFFFFF' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
    ...Shadows.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: { fontSize: 16, fontWeight: '700', color: Colors.gray900 },
  orderDate: { fontSize: 12, color: Colors.gray400 },
  customer: { fontSize: 14, color: Colors.gray600, marginBottom: 4 },
  amount: { fontSize: 16, fontWeight: '600', color: Colors.gray900, marginBottom: 8 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.amber,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  settledBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray600,
  },
  settledBadgeGreen: {
    color: '#16a34a',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
});

export default OrderHistoryScreen;