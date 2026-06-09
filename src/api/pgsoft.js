import api from './client.js';

export const PgsoftAPI = {
  games: () => api.get('/pgsoft/games'),
  launchHtml: (payload) => api.post('/pgsoft/launch', payload, {
    responseType: 'text',
    transformResponse: [(data) => data],
  }),
};
