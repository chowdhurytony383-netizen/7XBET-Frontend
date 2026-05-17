import api from './client.js';

function isFormData(payload) {
  return typeof FormData !== 'undefined' && payload instanceof FormData;
}

function formConfig(payload) {
  if (!isFormData(payload)) return undefined;
  return { headers: { 'Content-Type': 'multipart/form-data' } };
}

export const SupportAPI = {
  list(params = {}) {
    return api.get('/support', { params });
  },
  create(payload) {
    return api.post('/support', payload, formConfig(payload));
  },
  get(ticketId) {
    return api.get(`/support/${ticketId}`);
  },
  sendMessage(ticketId, payload) {
    return api.post(`/support/${ticketId}/messages`, payload, formConfig(payload));
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
    return api.post(`/admin/support/${ticketId}/messages`, payload, formConfig(payload));
  },
  updateStatus(ticketId, payload) {
    return api.patch(`/admin/support/${ticketId}/status`, payload);
  },
};
