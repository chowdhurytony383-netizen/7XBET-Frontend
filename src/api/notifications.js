import api from './client.js';

export const NotificationAPI = {
  list(params = {}) {
    return api.get('/notifications', { params });
  },
  unreadCount() {
    return api.get('/notifications/unread-count');
  },
  markRead(notificationId) {
    return api.patch(`/notifications/${notificationId}/read`);
  },
  markAllRead(params = {}) {
    return api.patch('/notifications/read-all', null, { params });
  },
};

export const AdminNotificationAPI = {
  list(params = {}) {
    return api.get('/admin/notifications', { params: { audience: 'admin', ...params } });
  },
  create(payload) {
    return api.post('/admin/notifications', payload);
  },
};
