import api from './client.js';

export const VipAPI = {
  summary: () => api.get('/vip/me'),
  claimReward: (rewardId) => api.post(`/vip/rewards/${rewardId}/claim`),
};
