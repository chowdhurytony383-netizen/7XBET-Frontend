import api from './client.js';

export const PgsoftAPI = {
  games: () => api.get('/pgsoft/games'),
  createLaunchTicket: (payload) => api.post('/pgsoft/launch-ticket', payload),
};
