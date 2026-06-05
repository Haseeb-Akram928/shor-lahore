'use client';

import { useEffect, useState } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';

export function useSocket(autoConnect = true) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = autoConnect ? connectSocket() : getSocket();
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      if (autoConnect) disconnectSocket();
    };
  }, [autoConnect]);

  return { socket: getSocket(), isConnected };
}
