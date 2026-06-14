import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const token = await AsyncStorage.getItem('riderToken');
      const riderData = await AsyncStorage.getItem('riderData');
      
      if (token && riderData) {
        setRider(JSON.parse(riderData));
        setIsAuthenticated(true);
        
        try {
          const { data } = await api.get('/auth/me');
          setRider(data);
          await AsyncStorage.setItem('riderData', JSON.stringify(data));
        } catch (error) {
          await logout();
        }
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, phone, password, vehicleDetails) => {
    try {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        phone,
        password,
        role: 'rider',
        vehicle: vehicleDetails,
      });

      await AsyncStorage.setItem('riderToken', data.token);
      await AsyncStorage.setItem('riderData', JSON.stringify(data));
      
      setRider(data);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed';
      return { success: false, message };
    }
  };

  const login = async (email, phone, password) => {
    try {
      const payload = { password };
      if (email) payload.email = email;
      if (phone) payload.phone = phone;

      const { data } = await api.post('/auth/login', payload);

      if (data.role !== 'rider') {
        return { success: false, message: 'This account is not a rider' };
      }

      await AsyncStorage.setItem('riderToken', data.token);
      await AsyncStorage.setItem('riderData', JSON.stringify(data));
      
      setRider(data);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  // ✅ FIXED LOGOUT FUNCTION
  const logout = async () => {
  console.log('5. logout() function started');
  
  try {
    console.log('6. Clearing AsyncStorage...');
    await AsyncStorage.removeItem('riderToken');
    console.log('7. riderToken removed');
    
    await AsyncStorage.removeItem('riderData');
    console.log('8. riderData removed');
    
    console.log('9. Resetting state...');
    setRider(null);
    setIsAuthenticated(false);
    
    console.log('10. Logout complete - should navigate to login');
  } catch (error) {
    console.error('Logout error:', error);
    
    // Force clear even if fails
    setRider(null);
    setIsAuthenticated(false);
    console.log('11. Force logout complete');
  }
};

  const updateProfile = async (updatedData) => {
    try {
      const { data } = await api.put('/auth/me', updatedData);
      setRider(data);
      await AsyncStorage.setItem('riderData', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Update failed' };
    }
  };

  return (
    <AuthContext.Provider value={{
      rider,
      loading,
      isAuthenticated,
      signup,
      login,
      logout,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};