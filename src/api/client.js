import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ORIGIN = rawBaseURL.replace(/\/$/, '');
export const API_BASE_URL = `${API_ORIGIN}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original && !original.__retried && !original.url?.includes('/user/refresh-token')) {
      original.__retried = true;
      try {
        await api.post('/user/refresh-token');
        return api(original);
      } catch (_) {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export function getApiError(error, fallback = 'Request failed') {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
}

export default api;
