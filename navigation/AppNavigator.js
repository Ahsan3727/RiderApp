import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActiveOrderProvider } from '../context/ActiveOrderContext';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import WaitingScreen from '../screens/WaitingScreen';
import OrderAssignedScreen from '../screens/OrderAssignedScreen';
import ArriveWholesalerScreen from '../screens/ArriveWholesalerScreen';
import StartDeliveryScreen from '../screens/StartDeliveryScreen';
import ArriveCustomerScreen from '../screens/ArriveCustomerScreen';
import EarningsHistoryScreen from '../screens/EarningsHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import ChatScreen from '../screens/ChatScreen';
import ReportIssueScreen from '../screens/ReportIssueScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { rider, loading } = useAuth();

  if (loading) {
    return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><ActivityIndicator size="large" /></View>;
  }

  return (
    <ActiveOrderProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {rider ? (
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Waiting" component={WaitingScreen} />
              <Stack.Screen name="OrderAssigned" component={OrderAssignedScreen} />
              <Stack.Screen name="ArriveWholesaler" component={ArriveWholesalerScreen} />
              <Stack.Screen name="StartDelivery" component={StartDeliveryScreen} />
              <Stack.Screen name="ArriveCustomer" component={ArriveCustomerScreen} />
              <Stack.Screen name="EarningsHistory" component={EarningsHistoryScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ActiveOrderProvider>
  );
};

export default AppNavigator;
