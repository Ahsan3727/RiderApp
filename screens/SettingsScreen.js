import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AppButton from '../components/AppButton';
import Card from '../components/Card';
import ToggleSwitch from '../components/ToggleSwitch';
import { Colors, Fonts, Shadows, Radius } from '../theme';
export default function SettingsScreen({ navigation }) {
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <AppButton title="← Back" type="ghost" size="sm" onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      <Card style={{ marginHorizontal: 16 }}>
        <View style={styles.row}>
          <Text style={styles.label}>Notifications</Text>
          <ToggleSwitch value={notifications} onToggle={() => setNotifications(!notifications)} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Sound</Text>
          <ToggleSwitch value={sound} onToggle={() => setSound(!sound)} />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 8, marginBottom: 20 },
  title: { fontSize: Fonts.sizes.xl, ...Fonts.bold },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  label: { fontSize: Fonts.sizes.md, color: Colors.gray700 },
});