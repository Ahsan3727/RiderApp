import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Shadows, Radius } from '../theme';
export default function InputGroup({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, editable = true }) {
  return (
    <View style={styles.container}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray400}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray50,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.gray200,
    paddingHorizontal: 14, marginBottom: 10,
  },
  icon: { fontSize: 15, color: Colors.gray400, marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.gray900, letterSpacing: -0.2 },
});