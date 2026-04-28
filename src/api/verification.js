import api from './client.js';

export const VerificationAPI = {
  getMine: () => api.get('/user/verification'),
  submit: (payload) => api.post('/user/verification', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (payload) => api.patch('/user/verification', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};
