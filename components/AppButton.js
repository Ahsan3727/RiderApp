import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Fonts, Shadows, Radius } from '../theme';
export default function AppButton({ title, onPress, loading, type = 'primary', size = 'md', style, textStyle, disabled }) {
  const btnStyle = [
    styles.base,
    type === 'primary' && styles.primary,
    type === 'outline' && styles.outline,
    type === 'ghost' && styles.ghost,
    size === 'sm' && styles.sm,
    size === 'xs' && styles.xs,
    disabled && styles.disabled,
    style,
  ];
  const txtStyle = [
    styles.text,
    type === 'primary' && styles.textPrimary,
    type === 'outline' && styles.textOutline,
    type === 'ghost' && styles.textGhost,
    size === 'sm' && styles.textSm,
    size === 'xs' && styles.textXs,
    textStyle,
  ];
  return (
    <TouchableOpacity style={btnStyle} onPress={onPress} disabled={loading || disabled} activeOpacity={0.8}>
      {loading ? <ActivityIndicator color={type === 'primary' ? '#fff' : Colors.primary600} /> : <Text style={txtStyle}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 22, flexDirection: 'row' },
  primary: { backgroundColor: Colors.primary600, shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 18, elevation: 4 },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.gray200 },
  ghost: { backgroundColor: 'transparent' },
  sm: { paddingVertical: 10, paddingHorizontal: 16 },
  xs: { paddingVertical: 6, paddingHorizontal: 12 },
  disabled: { opacity: 0.5 },
  text: { fontSize: Fonts.sizes.md, ...Fonts.semibold, letterSpacing: -0.2 },
  textPrimary: { color: '#fff' },
  textOutline: { color: Colors.gray600 },
  textGhost: { color: Colors.gray600 },
  textSm: { fontSize: Fonts.sizes.sm },
  textXs: { fontSize: Fonts.sizes.xs },
});