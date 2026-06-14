import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, Shadows, Radius } from '../theme';

const tabs = [
  { label: 'Home', icon: '🏠', screen: 'Dashboard' },
  { label: 'Orders', icon: '📋', screen: 'Waiting' },
  { label: 'Active', icon: '🚚', screen: 'OrderAssigned' }, // will show active order if exists
  { label: 'Earnings', icon: '💰', screen: 'EarningsHistory' },
  { label: 'Profile', icon: '👤', screen: 'Profile' },
];

export default function BottomTabBar({ navigation, activeScreen }) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeScreen === tab.screen;
        return (
          <TouchableOpacity
            key={tab.screen}
            style={styles.tabItem}
            onPress={() => {
              if (tab.screen === 'OrderAssigned') {
                // You can navigate to order assigned screen; if no active order, maybe navigate to Waiting
                navigation.navigate('OrderAssigned');
              } else {
                navigation.navigate(tab.screen);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, isActive && styles.activeIcon]}>{tab.icon}</Text>
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    paddingBottom: 20, // safe area
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 0.5,
    borderTopColor: Colors.gray200,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Shadows.md,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  icon: {
    fontSize: 20,
  },
  activeIcon: {
    transform: [{ scale: 1.2 }],
  },
  label: {
    fontSize: 10,
    color: Colors.gray400,
    fontWeight: '500',
  },
  activeLabel: {
    color: Colors.primary600,
    fontWeight: '600',
  },
});