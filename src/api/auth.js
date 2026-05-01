import api, { API_BASE_URL } from './client.js';

const socialAuthFallbackUrls = {
  google: `${API_BASE_URL}/auth/google`,
  facebook: `${API_BASE_URL}/auth/facebook`,
};

export const AuthAPI = {
  login: (payload) => api.post('/user/login', payload),
  register: (payload) => api.post('/user/register', payload),
  oneClickRegister: (payload) => api.post('/user/one-click-register', payload),
  logout: () => api.post('/user/logout'),
  isAuthenticated: () => api.get('/user/is-auth'),
  me: () => api.get('/user/my-details'),
  updateProfile: (payload) => api.patch('/user/update-user-details', payload),
  updateProfilePicture: (formData) => api.patch('/user/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  verifyEmail: (token) => api.get(`/user/verify-user/${token}`),
  resendVerification: (email) => api.post('/user/resend-verification', { email }),
  requestPasswordOtp: (email) => api.post('/user/reset-password', { email }),
  verifyPasswordOtp: (payload) => api.post('/user/verify-reset-password-otp', payload),
  setNewPassword: (payload) => api.post('/user/set-new-password', payload),
  socialAuthUrl: (provider) => {
    const normalized = String(provider || '').toLowerCase();
    const envUrl = normalized === 'google'
      ? import.meta.env.VITE_GOOGLE_AUTH_URL
      : import.meta.env.VITE_FACEBOOK_AUTH_URL;

    return envUrl || socialAuthFallbackUrls[normalized];
  },
};
