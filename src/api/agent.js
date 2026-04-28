import api from './client.js';

export const AgentAPI = {
  login: (payload) => api.post('/agent/login', payload),
  logout: () => api.post('/agent/logout'),
  me: () => api.get('/agent/me'),
  transactions: () => api.get('/agent/transactions'),
  paymentMethods: () => api.get('/agent/payment-methods'),
  updatePaymentMethod: (methodKey, formData) =>
    api.put(`/agent/payment-methods/${methodKey}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  requests: (params = {}) => api.get('/agent/requests', { params }),
  confirmRequest: (requestId, payload = {}) => api.post(`/agent/requests/${requestId}/confirm`, payload),
  rejectRequest: (requestId, payload = {}) => api.post(`/agent/requests/${requestId}/reject`, payload),
};
