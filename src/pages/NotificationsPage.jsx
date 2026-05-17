import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, CheckCheck } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { NotificationAPI } from '../api/notifications.js';
import { getApiError } from '../api/client.js';
import { formatDate } from '../utils/format.js';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await NotificationAPI.list({ limit: 100 });
      setItems(response.data?.data?.items || []);
    } catch (error) {
      toast.error(getApiError(error, 'Unable to load notifications'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await NotificationAPI.markRead(id);
      setItems((current) => current.map((item) => item._id === id ? { ...item, readAt: item.readAt || new Date().toISOString() } : item));
    } catch (error) {
      toast.error(getApiError(error, 'Unable to update notification'));
    }
  };

  const markAll = async () => {
    try {
      await NotificationAPI.markAllRead();
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(getApiError(error, 'Unable to mark all read'));
    }
  };

  return (
    <main className="notifications-page">
      <PageHeader eyebrow="Account" title="Notifications" description="View all system, support, bonus, deposit, withdrawal and account notifications." />

      <section className="notifications-card">
        <div className="notifications-head">
          <strong><Bell size={18} /> Notification center</strong>
          <button type="button" onClick={markAll}><CheckCheck size={16} /> Mark all read</button>
        </div>
        <div className="notifications-list">
          {items.map((item) => (
            <article key={item._id} className={`notification-row ${item.readAt ? '' : 'unread'}`}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small>{item.type} · {formatDate(item.createdAt)}</small>
              </div>
              {!item.readAt && <button type="button" onClick={() => markRead(item._id)}>Mark read</button>}
            </article>
          ))}
          {!loading && items.length === 0 && <div className="notifications-empty">No notifications yet.</div>}
        </div>
      </section>
    </main>
  );
}
