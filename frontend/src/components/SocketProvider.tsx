"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { authApi } from '@/lib/api/authApi';
import {
  dispatchOrdersChanged,
  dispatchRefreshNotifications,
  OrderSocketPayload,
} from '@/lib/live-updates';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socketInstance = io(socketUrl, {
      transports: ['websocket'],
    });

    const joinRooms = async () => {
      try {
        const user = await authApi.getMe();
        const role = user.role?.toLowerCase();
        if (role) socketInstance.emit('join_role', role);
        if (user.id) socketInstance.emit('join_user', String(user.id));
      } catch {
        // Public pages — no role rooms
      }
    };

    socketInstance.on('connect', () => {
      setIsConnected(true);
      joinRooms();
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Targeted live updates — no full-page refresh
    socketInstance.on('new_order', (payload: OrderSocketPayload) => {
      dispatchOrdersChanged({ ...payload, action: 'new' });
      dispatchRefreshNotifications();
    });

    socketInstance.on('order_update', (payload: OrderSocketPayload) => {
      dispatchOrdersChanged({ ...payload, action: 'update' });
    });

    socketInstance.on('order_ready', (payload: OrderSocketPayload) => {
      dispatchOrdersChanged({ ...payload, action: 'ready', status: 'ready' });
      dispatchRefreshNotifications();
    });

    socketInstance.on('notification', () => {
      dispatchRefreshNotifications();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
