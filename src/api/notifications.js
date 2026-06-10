import api from './client.js';

export const NotificationsAPI = {
  saveToken: (payload) => api.post('/notifications/token', payload),
  removeToken: (payload) => api.delete('/notifications/token', { data: payload }),
  testLuckyWheelReady: () => api.post('/notifications/test-lucky-wheel-ready'),
};

export default NotificationsAPI;
