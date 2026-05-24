"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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

  // Store router in a ref so the socket useEffect never re-runs because of it
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socketInstance = io(socketUrl, {
      transports: ['websocket'], // skip long-polling, go straight to WebSocket
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Dispatch a window event so individual pages can refetch their own data
    socketInstance.on('refresh_orders', () => {
      window.dispatchEvent(new CustomEvent('refresh_orders'));
      // NOTE: do NOT call router.refresh() here — it causes all useEffects
      // on the page to re-run and every API to be called again.
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []); // ← empty deps: socket is created ONCE and never recreated

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
