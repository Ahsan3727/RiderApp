import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useActiveOrder } from '../context/ActiveOrderContext';
import { Colors } from '../theme/theme';

export default function ArriveCustomerScreen({ navigation }) {
  const { completeOrder } = useActiveOrder();

  const handleComplete = () => {
    completeOrder();
    navigation.navigate('Dashboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Delivery</Text>
      <Text>Take a photo proof (simulated)</Text>
      <TouchableOpacity style={styles.photoBtn}>
        <Text>📸 Capture Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
        <Text style={styles.completeText}>Mark as Delivered</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate('ReportIssue')}>
        <Text>⚠️ Report Issue</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:20, backgroundColor:Colors.background },
  title: { fontSize:24, fontWeight:'bold', marginBottom:20 },
  photoBtn: { backgroundColor:Colors.lightGray, padding:16, borderRadius:8, marginBottom:12 },
  completeBtn: { backgroundColor:Colors.primary, padding:16, borderRadius:12, width:'100%', alignItems:'center', marginBottom:12 },
  completeText: { color:Colors.white, fontWeight:'bold' },
  reportBtn: { marginTop:8 }
});
