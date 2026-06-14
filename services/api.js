import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Auto-detect the correct URL
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'https://groxo-0zy1.onrender.com/api'; // Android Emulator
  }
  return 'https://groxo-0zy1.onrender.com/api';  // iOS Simulator
};

// For physical device, uncomment and use your IP:
// const BASE_URL = 'http://192.168.1.105:5000/api'; // ← PUT YOUR IP HERE

const BASE_URL = getBaseUrl();

console.log('API Base URL:', BASE_URL); // This will show in Expo logs

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('riderToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`📡 ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status);
    return response;
  },
  async (error) => {
    console.log('❌ Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('riderToken');
      await AsyncStorage.removeItem('riderData');
    }
    return Promise.reject(error);
  }
);

export default api;