import api from './client.js';

export const AgentPaymentAPI = {
  getMethods: (agentId) => api.get(`/agent/${agentId}/payment-methods`),
};
