import { io } from 'socket.io-client';
import { API_ORIGIN, getStoredAccessToken } from '../api/client.js';

let socket;
let lastAuthToken = '';

function currentToken() {
  return getStoredAccessToken() || '';
}

export function getRealtimeSocket() {
  const token = currentToken();

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
      auth: { token },
    });
    lastAuthToken = token;
  }

  socket.auth = { token };
  return socket;
}

export function connectRealtimeSocket() {
  const token = currentToken();
  const instance = getRealtimeSocket();

  // Socket auth is read on connection handshake. If login token changed after the
  // socket was created, reconnect so support/notification rooms join correctly.
  if (instance.connected && token !== lastAuthToken) {
    instance.disconnect();
  }

  instance.auth = { token };
  lastAuthToken = token;

  if (!instance.connected) {
    instance.connect();
  } else {
    instance.emit('realtime:auth');
  }

  return instance;
}

export function closeRealtimeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    lastAuthToken = '';
  }
}
