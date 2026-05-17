import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { NotificationAPI } from '../api/notifications.js';
import { getApiError } from '../api/client.js';
import { getRealtimeSocket } from '../socket/realtimeSocket.js';
import { useAuth } from '../context/AuthContext.jsx';
import './NotificationBell.css';

function formatTime(value) {
  if (!value) return '';
  try { return new Date(value).toLocaleString(); } catch (_) { return ''; }
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const canAdmin = Boolean(user?.role === 'admin' || user?.permissions?.includes?.('admin'));
  const audience = canAdmin ? 'admin' : undefined;

  const loadCount = async () => {
    if (!user) return;
    try {
      const response = await NotificationAPI.unreadCount();
      const data = response.data?.data || {};
      setUnreadCount(canAdmin ? Number(data.adminUnreadCount || 0) + Number(data.unreadCount || 0) : Number(data.unreadCount || 0));
    } catch (_) {}
  };

  const loadItems = async () => {
    if (!user) return;
    try {
      const response = await NotificationAPI.list({ limit: 8, audience });
      const data = response.data?.data || {};
      setItems(data.items || []);
      if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to load notifications'));
    }
  };

  useEffect(() => {
    loadCount();
    const timer = window.setInterval(loadCount, 30000);
    return () => window.clearInterval(timer);
  }, [user?._id, canAdmin]);

  useEffect(() => {
    if (!user) return undefined;
    const socket = getRealtimeSocket();
    const onNew = (payload = {}) => {
      setUnreadCount((count) => typeof payload.unreadCount === 'number' ? payload.unreadCount : count + 1);
      if (payload.notification) setItems((current) => [payload.notification, ...current].slice(0, 8));
    };
    socket.on('notification:new', onNew);
    if (!socket.connected) socket.connect();
    return () => socket.off('notification:new', onNew);
  }, [user?._id]);

  useEffect(() => {
    const listener = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) await loadItems();
  };

  const markAll = async () => {
    try {
      await NotificationAPI.markAllRead(audience ? { audience } : {});
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to mark notifications read'));
    }
  };

  if (!user) return null;

  return (
    <div className="notification-bell" ref={ref}>
      <button type="button" className="notification-bell-button" onClick={toggle} aria-label="Notifications">
        <Bell size={18} />
        {unreadCount > 0 && <span>{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-menu">
          <div className="notification-menu-head">
            <strong>Notifications</strong>
            <button type="button" onClick={markAll}><CheckCheck size={14} /> Read all</button>
          </div>
          <div className="notification-menu-list">
            {items.map((item) => (
              <Link key={item._id || `${item.title}-${item.createdAt}`} to={item.actionUrl || '/notifications'} className={`notification-menu-item ${item.readAt ? '' : 'unread'}`} onClick={() => setOpen(false)}>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small>{formatTime(item.createdAt)}</small>
              </Link>
            ))}
            {items.length === 0 && <div className="notification-empty">No notifications yet.</div>}
          </div>
          <Link className="notification-view-all" to="/notifications" onClick={() => setOpen(false)}>View all notifications</Link>
        </div>
      )}
    </div>
  );
}
