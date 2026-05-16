"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Connect to the socket server
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socketInstance = io(socketUrl);

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Listen to global refresh orders event
    socketInstance.on('refresh_orders', () => {
      console.log('Received refresh_orders event via Socket. Refreshing data...');
      
      // Dispatch a window event so individual client components can refetch
      window.dispatchEvent(new CustomEvent('refresh_orders'));
      
      // Tell Next.js to refresh server components and current route data
      router.refresh();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [router]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
