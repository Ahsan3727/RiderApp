import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import api from '../services/api';
import Card from '../components/Card';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts, Radius } from '../theme';

export default function EarningsHistoryScreen({ navigation }) {
  const [earnings, setEarnings] = useState([]);

  useEffect(() => {
    api.get('/rider/dashboard').then(res => {
      setEarnings([
        { id: '1', orderId: '201', amount: 23.50, tip: 3.00, date: new Date() },
        { id: '2', orderId: '202', amount: 15.75, tip: 2.00, date: new Date(Date.now()-86400000) },
      ]);
    }).catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💰 My Earnings</Text>
      <Card style={styles.earnCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceValue}>${earnings.reduce((sum, e) => sum + e.amount + e.tip, 0).toFixed(2)}</Text>
      </Card>
      <FlatList
        data={earnings}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontWeight: '600' }}>#{item.orderId}</Text>
              <Text style={{ color: Colors.primary600, fontWeight: '700' }}>${(item.amount+item.tip).toFixed(2)}</Text>
            </View>
            <Text style={{ fontSize: 12, color: Colors.gray400 }}>{item.date.toLocaleDateString()}</Text>
          </Card>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      />
      <BottomTabBar navigation={navigation} activeScreen="EarningsHistory" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  title: { fontSize: Fonts.sizes.xl, ...Fonts.bold, padding: 16, paddingTop: 50 },
  earnCard: { backgroundColor: Colors.primary900, borderRadius: Radius.xl, padding: 20, marginHorizontal: 16, marginBottom: 20 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  balanceValue: { color: '#fff', fontSize: 32, ...Fonts.extrabold, marginTop: 4 },
});