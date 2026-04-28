import api from './client.js';

export const SportsAPI = {
  categories: () => api.get('/sports/categories'),
  liveMatches: () => api.get('/sports/live-matches'),
  matchOfTheDay: () => api.get('/sports/match-of-the-day'),
};
