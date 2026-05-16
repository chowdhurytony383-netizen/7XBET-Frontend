import api from './client.js';

export const AffiliateAPI = {
  validateAffiliateCode: (code) => api.get(`/affiliate/validate/${encodeURIComponent(code)}`),
  trackClick: (code, payload = {}) => api.post(`/affiliate/track-click/${encodeURIComponent(code)}`, payload),
  apply: (payload) => api.post('/affiliate/apply', payload),
  dashboard: () => api.get('/affiliate/dashboard'),
  users: () => api.get('/affiliate/users'),
  requestPayout: (payload) => api.post('/affiliate/payout-request', payload),
};

export const ReferralAPI = {
  validateCode: (code) => api.get(`/referral/validate/${encodeURIComponent(code)}`),
  dashboard: () => api.get('/referral/me'),
  applyCode: (payload) => api.post('/referral/apply-code', payload),
};

export const AdminAffiliateAPI = {
  list: (params = {}) => api.get('/admin/affiliates', { params }),
  details: (affiliateId) => api.get(`/admin/affiliates/${affiliateId}`),
  updateStatus: (affiliateId, payload) => api.patch(`/admin/affiliates/${affiliateId}/status`, payload),
  updateCommission: (affiliateId, payload) => api.patch(`/admin/affiliates/${affiliateId}/commission`, payload),
  calculatePeriod: (affiliateId, payload) => api.post(`/admin/affiliates/${affiliateId}/calculate-period`, payload),
  approvePeriod: (periodId) => api.patch(`/admin/affiliate-periods/${periodId}/approve`),
  payouts: (params = {}) => api.get('/admin/affiliate-payouts', { params }),
  updatePayoutStatus: (payoutId, payload) => api.patch(`/admin/affiliate-payouts/${payoutId}/status`, payload),
};
