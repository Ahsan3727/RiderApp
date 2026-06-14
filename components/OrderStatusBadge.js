import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Shadows, Radius } from '../theme';
const statusConfig = {
  pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
  accepted: { bg: '#dbeafe', text: '#1e40af', label: 'Accepted' },
  picked: { bg: '#f3e8ff', text: '#6b21a8', label: 'Picked Up' },
  onway: { bg: '#fff7ed', text: '#c2410c', label: 'On Way' },
  out_for_delivery: { bg: '#fff7ed', text: '#c2410c', label: 'On Way' },
  completed: { bg: '#dcfce7', text: '#166534', label: 'Completed' },
  delivered: { bg: '#dcfce7', text: '#166534', label: 'Delivered' },
};

export default function OrderStatusBadge({ status }) {
  const config = statusConfig[status] || { bg: '#e2e8f0', text: '#334155', label: status?.replace(/_/g, ' ') || status };
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
});