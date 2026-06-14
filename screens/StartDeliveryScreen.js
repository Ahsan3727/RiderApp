import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LiveMap from '../components/LiveMap';
import { useActiveOrder } from '../context/ActiveOrderContext';
import { Colors } from '../theme/theme';

export default function StartDeliveryScreen({ navigation }) {
  const { activeOrder, updateOrderStatus } = useActiveOrder();

  const handleArriveCustomer = () => {
    updateOrderStatus('arrived_at_customer');
    navigation.navigate('ArriveCustomer');
  };

  return (
    <View style={styles.container}>
      <LiveMap region={{ latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.01, longitudeDelta: 0.01 }} />
      <View style={styles.overlay}>
        <Text>Delivery to: {activeOrder?.deliveryAddress}</Text>
        <TouchableOpacity style={styles.btn} onPress={handleArriveCustomer}>
          <Text style={styles.btnText}>I've Arrived</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { role: 'customer' })}>
          <Text>💬 Chat with Customer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1 },
  overlay: { position:'absolute', bottom:30, left:20, right:20, backgroundColor:Colors.white, padding:20, borderRadius:12, elevation:5 },
  btn: { backgroundColor:Colors.primary, padding:14, borderRadius:8, alignItems:'center', marginTop:12 },
  btnText: { color:Colors.white, fontWeight:'bold' },
  chatBtn: { marginTop:8, alignItems:'center' }
});
