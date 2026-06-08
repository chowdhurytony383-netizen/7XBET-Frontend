import api from './client.js';

export const FreeSpinAPI = {
  status() {
    return api.get('/free-spin/status');
  },
  spin() {
    return api.post('/free-spin/spin');
  },
};

export default FreeSpinAPI;
