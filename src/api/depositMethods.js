import api from './client.js';

const multipartHeaders = { headers: { 'Content-Type': 'multipart/form-data' } };

export const DepositMethodAPI = {
  list: () => api.get('/admin/deposit-methods'),
  create: (formData) => api.post('/admin/deposit-methods', formData, multipartHeaders),
  update: (methodKey, formData) => api.put(`/admin/deposit-methods/${methodKey}`, formData, multipartHeaders),
  disable: (methodKey) => api.delete(`/admin/deposit-methods/${methodKey}`),
};
