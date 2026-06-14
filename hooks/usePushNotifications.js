import { useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from '../services/api';

export default function usePushNotifications(enabled) {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (!enabled) return;

    // 🔴 Skip push notification setup on web
    if (Platform.OS === 'web') {
      console.log('Push notifications are not supported on web. Use a physical device.');
      return;
    }

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        saveTokenToBackend(token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [enabled]);

  const saveTokenToBackend = async (token) => {
    try {
      await api.put('/auth/push-token', { expoPushToken: token });
    } catch (error) {
      console.error('Failed to save push token', error);
    }
  };
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for notifications!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return token;
}