import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppButton from '../components/AppButton';
import InputGroup from '../components/InputGroup';
import Card from '../components/Card';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { rider, updateProfile, logout } = useAuth();
  const [name, setName] = useState(rider?.name || '');
  const [phone, setPhone] = useState(rider?.phone || '');
  const [vehicleType, setVehicleType] = useState(rider?.vehicle?.type || '');
  const [plateNumber, setPlateNumber] = useState(rider?.vehicle?.plateNumber || '');

  const handleSave = async () => {
    const result = await updateProfile({ name, phone, vehicle: { type: vehicleType, plateNumber } });
    if (result.success) Alert.alert('Success', 'Profile updated');
    else Alert.alert('Error', result.message);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['riderToken', 'riderData']);
    } catch (e) {
      console.log('Clear storage error', e);
    }
    logout();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <AppButton title="← Back" type="ghost" size="sm" onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Profile</Text>
          <AppButton title="Save" type="ghost" size="sm" textStyle={{ color: Colors.primary600 }} onPress={handleSave} />
        </View>
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(rider?.name||'R')[0].toUpperCase()}</Text></View>
        </View>
        <Card style={{ marginHorizontal: 16 }}>
          <InputGroup icon="👤" placeholder="Name" value={name} onChangeText={setName} />
          <InputGroup icon="📧" placeholder="Email" value={rider?.email} editable={false} />
          <InputGroup icon="📱" placeholder="Phone" value={phone} onChangeText={setPhone} />
          <InputGroup icon="🏍️" placeholder="Vehicle Type" value={vehicleType} onChangeText={setVehicleType} />
          <InputGroup icon="🚦" placeholder="Plate Number" value={plateNumber} onChangeText={setPlateNumber} />
        </Card>
        <AppButton title="🚪 Logout" type="outline" style={{ marginHorizontal: 16, marginTop: 20, borderColor: '#fecaca' }} textStyle={{ color: Colors.red }} onPress={handleLogout} />
      </ScrollView>
      <BottomTabBar navigation={navigation} activeScreen="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 8 },
  title: { fontSize: Fonts.sizes.xl, ...Fonts.bold },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary600, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '700' },
});