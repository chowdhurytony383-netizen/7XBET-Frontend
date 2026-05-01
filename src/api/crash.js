import api from './client.js';

export const CrashAPI = {
  state: () => api.get('/crash/state'),
  history: () => api.get('/crash/history'),
  placeBet: (payload) => api.post('/crash/bet', payload),
  cashout: () => api.post('/crash/cashout'),
};
