import api from './client.js';

export const PublicContentAPI = {
  get: (endpoint) => api.get(endpoint),
};
