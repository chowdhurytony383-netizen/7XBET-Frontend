import api from './client.js';

export const CryptoAPI = {
  addresses: () => api.get('/crypto/addresses'),
  refreshAddresses: () => api.post('/crypto/addresses/refresh'),
  deposits: () => api.get('/crypto/deposits'),
};
