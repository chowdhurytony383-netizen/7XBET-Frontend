import { io } from 'socket.io-client';
import { API_ORIGIN } from '../api/client.js';

let socket;

export function getCrashSocket() {
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
  return socket;
}

export function closeCrashSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
