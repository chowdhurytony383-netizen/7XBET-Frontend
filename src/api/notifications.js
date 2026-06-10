import api from './client.js';

export const NotificationsAPI = {
  // Existing in-site notification APIs used by NotificationBell.jsx
  list: (params = {}) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),

  // Chrome/Web Push APIs for Lucky Wheel Ready notification
  saveToken: (payload) => api.post('/notifications/token', payload),
  removeToken: (payload) => api.delete('/notifications/token', { data: payload }),
  testLuckyWheelReady: () => api.post('/notifications/test-lucky-wheel-ready'),
};

// Backward-compatible name used by older components.
export const NotificationAPI = NotificationsAPI;

export default NotificationsAPI;
