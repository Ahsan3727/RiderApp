import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useActiveOrder } from '../context/ActiveOrderContext';
import { Colors } from '../theme/theme';

export default function ArriveWholesalerScreen({ navigation }) {
  const { updateOrderStatus } = useActiveOrder();

  const handlePickedUp = () => {
    updateOrderStatus('picked_up');
    navigation.navigate('StartDelivery');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Arrive at Wholesaler</Text>
      <View style={styles.card}>
        <Text>You've arrived at the wholesaler.</Text>
        <TouchableOpacity style={styles.btn} onPress={handlePickedUp}>
          <Text style={styles.btnText}>Mark as Picked Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:20, backgroundColor:Colors.background },
  title: { fontSize:24, fontWeight:'bold', marginBottom:16 },
  card: { backgroundColor:Colors.white, padding:20, borderRadius:12, width:'100%', elevation:3 },
  btn: { backgroundColor:Colors.primary, padding:14, borderRadius:8, alignItems:'center', marginTop:12 },
  btnText: { color:Colors.white, fontWeight:'bold' }
});
