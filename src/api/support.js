import api from './client.js';

export const SupportAPI = {
  list(params = {}) {
    return api.get('/support', { params });
  },
  create(payload) {
    return api.post('/support', payload);
  },
  get(ticketId) {
    return api.get(`/support/${ticketId}`);
  },
  sendMessage(ticketId, payload) {
    return api.post(`/support/${ticketId}/messages`, payload);
  },
  updateStatus(ticketId, payload) {
    return api.patch(`/support/${ticketId}/status`, payload);
  },
};

export const AdminSupportAPI = {
  list(params = {}) {
    return api.get('/admin/support', { params });
  },
  get(ticketId) {
    return api.get(`/admin/support/${ticketId}`);
  },
  sendMessage(ticketId, payload) {
    return api.post(`/admin/support/${ticketId}/messages`, payload);
  },
  updateStatus(ticketId, payload) {
    return api.patch(`/admin/support/${ticketId}/status`, payload);
  },
};
