import api from './client.js';

export const GamesAPI = {
  all: () => api.get('/games/get-all-games'),
  rollDice: (payload) => api.post('/games/dice/roll-dice', payload),
  startMines: (payload) => api.post('/games/mines/start-mine', payload),
  revealMineTile: (payload) => api.patch('/games/mines/reveal-tile', payload),
  endMines: (payload) => api.post('/games/mines/end-mine', payload),
  pendingMines: () => api.get('/games/mines/pending-mine'),
};
