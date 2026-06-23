import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import api from '../services/api';

const BACKGROUND_TASK = 'RIDER_LOCATION_TRACKING';
const UPDATE_INTERVAL = 8000; // 3 seconds

// Define the background task
TaskManager.defineTask(BACKGROUND_TASK, async ({ data, error }) => {
  if (error) return;
  const { locations } = data;
  if (locations && locations.length > 0) {
    const { latitude, longitude } = locations[0].coords;
    try {
      await api.put('/rider/location', { lat: latitude, lng: longitude });
      console.log('Background location sent', latitude, longitude);
    } catch (err) {
      console.error('Background location error', err);
    }
  }
});

export default function useLocationTracking(isAuthenticated) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const startForegroundTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const sendLocation = async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          const { latitude, longitude } = location.coords;
          await api.put('/rider/location', { lat: latitude, lng: longitude });
        } catch (error) {
          console.warn('Foreground location error', error);
        }
      };

      await sendLocation();
      intervalRef.current = setInterval(sendLocation, UPDATE_INTERVAL);
    };

    const startBackgroundTracking = async () => {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Background location permission denied');
        return;
      }

      // Start background updates – they will fire even when app is killed
      await Location.startLocationUpdatesAsync(BACKGROUND_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: UPDATE_INTERVAL,
        distanceInterval: 1,           // minimum distance (meters) between updates
        foregroundService: {
          notificationTitle: 'Groxo Rider',
          notificationBody: 'You are online and sharing your location',
        },
      });
    };

    const stopBackgroundTracking = async () => {
      await Location.stopLocationUpdatesAsync(BACKGROUND_TASK);
    };

    // Start everything
    startForegroundTracking();
    startBackgroundTracking();

    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopBackgroundTracking();   // clean up if component unmounts
    };
  }, [isAuthenticated]);
}