import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ActiveOrderProvider } from './context/ActiveOrderContext';   
import usePushNotifications from './hooks/usePushNotifications';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import DashboardScreen from './screens/DashboardScreen';
import WaitingScreen from './screens/WaitingScreen';
import OrderAssignedScreen from './screens/OrderAssignedScreen';
import EarningsHistoryScreen from './screens/EarningsHistoryScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import MapScreen from './screens/MapScreen';
import { ActivityIndicator, View } from 'react-native';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Warning: Failed prop type']); // not a real fix, but suppresses warnings

const Stack = createNativeStackNavigator();
const originalCreate = StyleSheet.create;
StyleSheet.create = (styles) => {
  const convert = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (let key in obj) {
      if (typeof obj[key] === 'string' && !isNaN(parseFloat(obj[key]))) {
        // convert numeric string to number
        obj[key] = parseFloat(obj[key]);
      } else if (typeof obj[key] === 'object') {
        convert(obj[key]);
      }
    }
    return obj;
  };
  return originalCreate(convert(styles));
};
const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  usePushNotifications(isAuthenticated);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Waiting" component={WaitingScreen} />
          <Stack.Screen name="OrderAssigned" component={OrderAssignedScreen} />
          <Stack.Screen name="EarningsHistory" component={EarningsHistoryScreen} />
          <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ActiveOrderProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ActiveOrderProvider>
    </AuthProvider>
  );
}