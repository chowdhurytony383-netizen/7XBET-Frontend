import api from './client.js';

export const SourceGamesAPI = {
  session: (gameCode) => api.get(`/source-games/${gameCode}/session`),
};