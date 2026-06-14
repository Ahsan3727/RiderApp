import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import api from '../services/api';

const UPDATE_INTERVAL = 30000; // 30 seconds

export default function useLocationTracking(isAuthenticated) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const startTracking = async () => {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      // Get current position and send immediately
      const sendLocation = async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          const { latitude, longitude } = location.coords;
          await api.put('/rider/location', { lat: latitude, lng: longitude });
          console.log('Location sent', latitude, longitude);
        } catch (error) {
          console.error('Location send error', error);
        }
      };

      await sendLocation(); // immediate first update

      // Periodic updates
      intervalRef.current = setInterval(sendLocation, UPDATE_INTERVAL);
    };

    startTracking();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated]);
}