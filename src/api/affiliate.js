import api, { API_BASE_URL } from './client.js';

export const AffiliateAPI = {
  validateAffiliateCode: (code) => api.get(`/affiliate/validate/${encodeURIComponent(code)}`),
  trackClick: (code, payload = {}) => api.post(`/affiliate/track-click/${encodeURIComponent(code)}`, payload),
  apply: (payload) => api.post('/affiliate/apply', payload),
  dashboard: (params = {}) => api.get('/affiliate/dashboard', { params }),
  users: (params = {}) => api.get('/affiliate/users', { params }),
  exportUsersCsvUrl: (params = {}) => `${API_BASE_URL}/affiliate/users/export.csv?${new URLSearchParams(params).toString()}`,
  exportPeriodsCsvUrl: () => `${API_BASE_URL}/affiliate/periods/export.csv`,
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
  fraudFlags: (params = {}) => api.get('/admin/affiliate-fraud-flags', { params }),
  updateFraudFlag: (flagId, payload) => api.patch(`/admin/affiliate-fraud-flags/${flagId}/status`, payload),
  runAutomation: (payload = { force: true }) => api.post('/admin/affiliate-automation/run', payload),
  scanFraud: (affiliateId, payload = {}) => api.post(`/admin/affiliates/${affiliateId}/fraud-scan`, payload),
  exportUsersCsvUrl: (affiliateId, params = {}) => `${API_BASE_URL}/admin/affiliates/${affiliateId}/users/export.csv?${new URLSearchParams(params).toString()}`,
};
