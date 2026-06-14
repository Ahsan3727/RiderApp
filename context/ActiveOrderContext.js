import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { Platform } from 'react-native';

const ActiveOrderContext = createContext();

export const ActiveOrderProvider = ({ children }) => {
  // ---------- Existing online/offline logic ----------
  const [isOnline, setIsOnline] = useState(false);
  const goOnline = () => setIsOnline(true);
  const goOffline = () => setIsOnline(false);

  // ---------- New: available orders & active order ----------
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const socketRef = useRef(null);

  // Fetch all pending orders (unassigned)
  const fetchAvailableOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/orders?status=pending');
      setAvailableOrders(data);
    } catch (err) {
      console.error('Fetch available orders error', err);
    }
  }, []);

  // Accept an order (rider self-assign)
  const acceptOrder = async (orderId) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/assign`, { riderId: null }); // rider self-assign
      setActiveOrder(data);
      setAvailableOrders(prev => prev.filter(o => o._id !== orderId));
      return data;
    } catch (err) {
      throw err;
    }
  };

  // Reject an order (just remove from list)
  const rejectOrder = (orderId) => {
    setAvailableOrders(prev => prev.filter(o => o._id !== orderId));
  };

  // Update order status (used by rider)
  const updateOrderStatus = async (orderId, status, note = '', riderLocation = null) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/status`, { status, note, riderLocation });
      if (status === 'delivered') {
        setActiveOrder(null);
      } else {
        setActiveOrder(data);
      }
      return data;
    } catch (err) {
      throw err;
    }
  };

  // ---------- Socket.io connection for real-time updates ----------
  useEffect(() => {
    const connectSocket = async () => {
      const token = await AsyncStorage.getItem('riderToken');
      const riderData = await AsyncStorage.getItem('riderData');
      if (!token || !riderData) return;
      const rider = JSON.parse(riderData);
      
      // Dynamically choose the correct host for the current platform
const baseUrl = Platform.OS === 'web'
  ? 'http://localhost:5000'      // Web development
  : 'http://10.0.2.2:5000';     // Android emulator (change for real device as needed)

const socket = io(baseUrl, {
  query: { userId: rider._id },
  auth: { token },
});
      socketRef.current = socket;

      socket.on('connect', () => console.log('Socket connected for orders'));
      socket.on('orderUpdated', (order) => {
        // If the updated order is assigned to this rider, update active order
        if (order.rider === rider._id || order.rider?._id === rider._id) {
          setActiveOrder(order);
        }
        // If a new pending order appears, refresh available list
        if (order.status === 'pending') {
          fetchAvailableOrders();
        }
      });
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [fetchAvailableOrders]);

  // ---------- Initial fetch when online ----------
  useEffect(() => {
    if (isOnline) {
      fetchAvailableOrders();
    }
  }, [isOnline, fetchAvailableOrders]);

  return (
    <ActiveOrderContext.Provider
      value={{
        // existing
        isOnline,
        goOnline,
        goOffline,
        // new
        availableOrders,
        activeOrder,
        loadingOrders,
        fetchAvailableOrders,
        acceptOrder,
        rejectOrder,
        updateOrderStatus,
      }}
    >
      {children}
    </ActiveOrderContext.Provider>
  );
};

export const useActiveOrder = () => useContext(ActiveOrderContext);