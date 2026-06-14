'use client';

import { io, type Socket } from 'socket.io-client';

const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL;
  if (typeof window === 'undefined') return 'http://localhost:5000';
  return `${window.location.protocol}//${window.location.hostname}:5000`;
};

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function connectSocket() {
  const current = getSocket();
  if (!current.connected) current.connect();
  return current;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
