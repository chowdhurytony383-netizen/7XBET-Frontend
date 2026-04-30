import api from './client.js';

export const AdminAgentPaymentAPI = {
  getMethods: (agentId) => api.get(`/admin/agents/${agentId}/payment-methods`),

  updateMethod: (agentId, methodKey, formData) =>
    api.put(`/admin/agents/${agentId}/payment-methods/${methodKey}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  getAccess: (agentId) => api.get(`/admin/agents/${agentId}/payment-method-access`),

  updateAccess: (agentId, payload) => api.put(`/admin/agents/${agentId}/payment-method-access`, payload),
};
