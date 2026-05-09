import api from './client.js';

export const SportsAPI = {
  categories: () => api.get('/sports/categories'),
  liveMatches: () => api.get('/sports/live-matches'),
  matchOfTheDay: () => api.get('/sports/match-of-the-day'),
  eventDetails: (eventId) => api.get(`/sports/events/${eventId}`),
  syncStatus: () => api.get('/sports/sync-status'),
  placeBet: (payload) => api.post('/sports/bets/place', payload),
  myBets: () => api.get('/sports/bets/my'),
};
