import { useEffect } from 'react';
import { connectRealtimeSocket } from '../socket/realtimeSocket.js';

export default function AgentPresenceConnector() {
  useEffect(() => {
    const socket = connectRealtimeSocket();
    socket.emit('realtime:auth');

    const timer = window.setInterval(() => {
      socket.emit('realtime:auth');
    }, 25000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
