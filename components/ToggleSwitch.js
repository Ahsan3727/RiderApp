import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors, Fonts, Shadows, Radius } from '../theme';

export default function ToggleSwitch({ value, onToggle }) {
  const translateX = useRef(new Animated.Value(value ? 22 : 0)).current;

  React.useEffect(() => {
    Animated.timing(translateX, { toValue: value ? 22 : 0, duration: 200, useNativeDriver: true }).start();
  }, [value]);

  return (
    <TouchableOpacity style={[styles.track, value && styles.activeTrack]} onPress={onToggle} activeOpacity={0.8}>
      <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: { width: 50, height: 28, borderRadius: 14, backgroundColor: Colors.gray300, justifyContent: 'center', padding: 3 },
  activeTrack: { backgroundColor: Colors.primary500 },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
});