import api from './client.js';

export const CrashNativeAPI = {
  state: () => api.get('/crash-native/state'),
  history: () => api.get('/crash-native/history'),
  placeBet: (payload) => api.post('/crash-native/bet', payload),
  cashout: (payload = {}) => api.post('/crash-native/cashout', payload),
};
