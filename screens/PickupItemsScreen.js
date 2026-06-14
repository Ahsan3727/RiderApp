import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useActiveOrder } from '../context/ActiveOrderContext';
import { Colors } from '../theme/theme';

export default function PickupItemsScreen() {
  const { activeOrder, updateOrderStatus } = useActiveOrder();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pickup Items</Text>
      <FlatList
        data={activeOrder?.items || []}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Text style={styles.item}>{item.name} x {item.qty}</Text>}
      />
      <TouchableOpacity style={styles.btn} onPress={() => updateOrderStatus('picked_up')}>
        <Text style={styles.btnText}>Confirm Pickup</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, padding:16 },
  title: { fontSize:22, fontWeight:'bold', marginBottom:12 },
  item: { padding:8, borderBottomWidth:1, borderColor:Colors.lightGray },
  btn: { backgroundColor:Colors.primary, padding:14, borderRadius:8, alignItems:'center', marginTop:16 },
  btnText: { color:Colors.white, fontWeight:'bold' }
});
