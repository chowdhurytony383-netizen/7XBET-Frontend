import api from './client.js';

export const JiliAPI = {
  launch: (gameId, payload = {}) => api.post(`/jili/launch/${gameId}`, payload),
  games: () => api.get('/jili/games'),
};
