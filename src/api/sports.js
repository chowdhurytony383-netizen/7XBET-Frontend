import api from './client.js';

export const SportsAPI = {
  categories: () => api.get('/sports/categories'),
  liveMatches: (params = {}) => api.get('/sports/live-matches', { params }),
  matchOfTheDay: () => api.get('/sports/match-of-the-day'),
  eventDetails: (eventId) => api.get(`/sports/events/${eventId}`),
  syncStatus: () => api.get('/sports/sync-status'),
  opticOddsCoverage: (params = {}) => api.get('/sports/opticodds/coverage', { params }),
  opticOddsCoverageSection: (kind, params = {}) => api.get(`/sports/opticodds/coverage/${kind}`, { params }),
  placeBet: (payload) => api.post('/sports/bets/place', payload),
  placeMultipleBets: (payload) => api.post('/sports/bets/place-multiple', payload),
  myBets: () => api.get('/sports/bets/my'),
};
