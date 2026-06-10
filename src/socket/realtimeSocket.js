import { io } from 'socket.io-client';
import { API_ORIGIN, getStoredAccessToken, getStoredAgentToken } from '../api/client.js';

let socket;
let lastAuthToken = '';
let lastAgentToken = '';

function currentToken() {
  return getStoredAccessToken() || '';
}

function currentAgentToken() {
  return getStoredAgentToken() || '';
}

function socketAuthPayload() {
  return {
    token: currentToken(),
    agentToken: currentAgentToken(),
  };
}

export function getRealtimeSocket() {
  const token = currentToken();
  const agentToken = currentAgentToken();

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
      auth: socketAuthPayload(),
    });
    lastAuthToken = token;
    lastAgentToken = agentToken;
  }

  socket.auth = socketAuthPayload();
  return socket;
}

export function connectRealtimeSocket() {
  const token = currentToken();
  const agentToken = currentAgentToken();
  const instance = getRealtimeSocket();

  // Socket auth is read on connection handshake. If login token changed after the
  // socket was created, reconnect so support/notification/presence rooms join correctly.
  if (instance.connected && (token !== lastAuthToken || agentToken !== lastAgentToken)) {
    instance.disconnect();
  }

  instance.auth = socketAuthPayload();
  lastAuthToken = token;
  lastAgentToken = agentToken;

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
    lastAgentToken = '';
  }
}
