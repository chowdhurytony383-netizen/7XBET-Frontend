import api, { clearAgentAuthToken, saveAgentAuthToken } from './client.js';

export const AgentAPI = {
  login: async (payload) => {
    const response = await api.post('/agent/login', payload);
    saveAgentAuthToken(response.data);
    return response;
  },
  logout: async () => {
    try {
      return await api.post('/agent/logout');
    } finally {
      clearAgentAuthToken();
    }
  },
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
