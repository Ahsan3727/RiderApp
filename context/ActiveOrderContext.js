import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { Platform } from 'react-native';

const ActiveOrderContext = createContext();

export const ActiveOrderProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(false);
  const goOnline = () => setIsOnline(true);
  const goOffline = () => setIsOnline(false);

  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const socketRef = useRef(null);

  // Fetch available (unassigned) orders – now includes confirmed
  const fetchAvailableOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/orders/available');
      setAvailableOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch available orders error', err);
    }
  }, []);

  // Fetch rider's current active order
  const fetchActiveOrder = useCallback(async () => {
    try {
      const { data } = await api.get('/rider/active-order');
      setActiveOrder(data.order || null);
    } catch (err) {
      setActiveOrder(null);
    }
  }, []);

  // Accept an order (self-assign)
  const acceptOrder = async (orderId) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/accept`);
      setActiveOrder(data);
      setAvailableOrders(prev => prev.filter(o => o._id !== orderId));
      return data;
    } catch (err) {
      throw err;
    }
  };

  // Reject an order (just remove from local list)
  const rejectOrder = (orderId) => {
    setAvailableOrders(prev => prev.filter(o => o._id !== orderId));
  };

  // Update order status (rider actions)
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

  // Socket connection and event listeners
  useEffect(() => {
    const connectSocket = async () => {
      const token = await AsyncStorage.getItem('riderToken');
      const riderData = await AsyncStorage.getItem('riderData');
      if (!token || !riderData) return;
      const rider = JSON.parse(riderData);

      const baseUrl = Platform.OS === 'web'
        ? 'http://localhost:5000'
        : 'http://10.0.2.2:5000';   // adjust for your actual backend URL

      const socket = io(baseUrl, {
        query: { userId: rider._id },
        auth: { token },
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Socket connected');
        socket.emit('joinRiderRoom');   // join the riders room
      });

      socket.on('orderUpdated', (order) => {
        const riderId = String(rider._id);
        const orderRiderId = order.rider?._id || order.rider;
        if (String(orderRiderId) === riderId) {
          setActiveOrder(order);
        }
      });

      socket.on('newAvailableOrder', () => {
        fetchAvailableOrders();   // refresh the available list instantly
      });
    };

    connectSocket();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [fetchAvailableOrders]);

  // Initial fetch when rider goes online
  useEffect(() => {
    if (isOnline) {
      fetchAvailableOrders();
      fetchActiveOrder();
    }
  }, [isOnline, fetchAvailableOrders, fetchActiveOrder]);

  return (
    <ActiveOrderContext.Provider
      value={{
        isOnline,
        goOnline,
        goOffline,
        availableOrders,
        activeOrder,
        loadingOrders,
        fetchAvailableOrders,
        acceptOrder,
        rejectOrder,
        updateOrderStatus,
        fetchActiveOrder,
      }}
    >
      {children}
    </ActiveOrderContext.Provider>
  );
};

export const useActiveOrder = () => useContext(ActiveOrderContext);