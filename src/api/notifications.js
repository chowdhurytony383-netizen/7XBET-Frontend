import api from './client.js';

export const NotificationAPI = {
  list(params = {}) {
    return api.get('/notifications', { params });
  },
  unreadCount() {
    return api.get('/notifications/unread-count');
  },
  markRead(notificationId) {
    return api.patch(`/notifications/${notificationId}/read`, {});
  },
  markAllRead(params = {}) {
    // IMPORTANT:
    // Do not send `null` as PATCH body. Express JSON parser can reject JSON primitives
    // like `null` with: Unexpected token 'n', "null" is not valid JSON.
    // Always send an object body so backend receives valid JSON.
    return api.patch('/notifications/read-all', {}, { params });
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
