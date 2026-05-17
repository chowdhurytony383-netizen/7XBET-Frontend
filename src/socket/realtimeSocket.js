import { io } from 'socket.io-client';
import { API_ORIGIN, getStoredAccessToken } from '../api/client.js';

let socket;

export function getRealtimeSocket() {
  if (!socket) {
    socket = io(API_ORIGIN, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    });
  }

  socket.auth = { token: getStoredAccessToken() };
  return socket;
}

export function closeRealtimeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
