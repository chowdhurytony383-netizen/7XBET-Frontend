import api from './client.js';

export const AdminAPI = {
  overview: () => api.get('/admin/overview'),
  users: (params = {}) => api.get('/admin/users', { params }),
  userDetails: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, payload) => api.patch(`/admin/users/${userId}`, payload),
  updateUserStatus: (userId, payload) => api.patch(`/admin/users/${userId}/status`, payload),
  updateUserVerification: (userId, payload) => api.patch(`/admin/users/${userId}/verification`, payload),
  deposits: (params = {}) => api.get('/admin/deposits', { params }),
  withdrawals: (params = {}) => api.get('/admin/withdrawals', { params }),
  updateDepositStatus: (transactionId, payload) => api.patch(`/admin/deposits/${transactionId}/status`, payload),
  updateWithdrawalStatus: (transactionId, payload) => api.patch(`/admin/withdrawals/${transactionId}/status`, payload),
  transactions: (params = {}) => api.get('/admin/transactions', { params }),
  games: () => api.get('/admin/games'),
  updateGame: (gameId, payload) => api.patch(`/admin/games/${gameId}`, payload),
  agents: (params = {}) => api.get('/admin/agents', { params }),
  createAgent: (payload) => api.post('/admin/agents', payload),
  updateAgentStatus: (agentId, payload) => api.patch(`/admin/agents/${agentId}/status`, payload),
  topUpAgent: (payload) => api.post('/admin/agents/top-up', payload),
  agentTransactions: (agentId) => api.get(`/admin/agents/${agentId}/transactions`),
  agentPaymentRequests: (params = {}) => api.get('/admin/agent-payment-requests', { params }),
};

