import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Fonts, Shadows, Radius } from '../theme';
export default function Card({ children, style, onPress, accent }) {
  const Container = onPress ? TouchableOpacity : View;
  const accentStyle = accent ? { borderLeftWidth: 4, borderLeftColor: accent } : {};
  return (
    <Container style={[styles.card, accentStyle, style]} onPress={onPress} activeOpacity={0.7}>
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
    ...Shadows.sm,
    marginBottom: 10,
  },
});