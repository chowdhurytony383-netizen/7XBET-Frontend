import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ORIGIN = rawBaseURL.replace(/\/$/, '');
export const API_BASE_URL = `${API_ORIGIN}/api`;

const ACCESS_TOKEN_KEY = '7xbet.auth.accessToken';
const REFRESH_TOKEN_KEY = '7xbet.auth.refreshToken';
const AGENT_TOKEN_KEY = '7xbet.agent.accessToken';

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStorage(key) {
  try {
    if (!storageAvailable()) return '';
    return window.localStorage.getItem(key) || '';
  } catch (_) {
    return '';
  }
}

function writeStorage(key, value) {
  try {
    if (!storageAvailable()) return;
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch (_) {}
}

export function getStoredAccessToken() {
  return readStorage(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return readStorage(REFRESH_TOKEN_KEY);
}

export function getStoredAgentToken() {
  return readStorage(AGENT_TOKEN_KEY);
}

export function saveAuthTokens(payload = {}) {
  const source = payload?.data?.tokens || payload?.tokens || payload?.data || payload || {};
  const accessToken = source.accessToken || source.access_token || payload?.accessToken || payload?.access_token || '';
  const refreshToken = source.refreshToken || source.refresh_token || payload?.refreshToken || payload?.refresh_token || '';

  if (accessToken) writeStorage(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) writeStorage(REFRESH_TOKEN_KEY, refreshToken);

  return {
    accessToken: accessToken || getStoredAccessToken(),
    refreshToken: refreshToken || getStoredRefreshToken(),
  };
}

export function saveAgentAuthToken(payload = {}) {
  const source = payload?.data?.tokens || payload?.tokens || payload?.data || payload || {};
  const agentToken = source.agentToken
    || source.agent_token
    || source.accessToken
    || source.access_token
    || payload?.agentToken
    || payload?.agent_token
    || '';

  if (agentToken) writeStorage(AGENT_TOKEN_KEY, agentToken);
  return agentToken || getStoredAgentToken();
}

export function clearAgentAuthToken() {
  writeStorage(AGENT_TOKEN_KEY, '');
}

export function clearAuthTokens() {
  writeStorage(ACCESS_TOKEN_KEY, '');
  writeStorage(REFRESH_TOKEN_KEY, '');
}

function readUrlTokenParams() {
  if (typeof window === 'undefined') return null;

  const searchParams = new URLSearchParams(window.location.search || '');
  const hashValue = (window.location.hash || '').replace(/^#/, '');
  const hashParams = new URLSearchParams(hashValue);

  const accessToken = searchParams.get('accessToken')
    || searchParams.get('authAccessToken')
    || hashParams.get('accessToken')
    || hashParams.get('authAccessToken')
    || '';

  const refreshToken = searchParams.get('refreshToken')
    || searchParams.get('authRefreshToken')
    || hashParams.get('refreshToken')
    || hashParams.get('authRefreshToken')
    || '';

  if (!accessToken && !refreshToken) return null;
  return { accessToken, refreshToken, searchParams, hashParams };
}

export function consumeAuthTokensFromUrl() {
  const data = readUrlTokenParams();
  if (!data) return false;

  saveAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });

  try {
    data.searchParams.delete('accessToken');
    data.searchParams.delete('authAccessToken');
    data.searchParams.delete('refreshToken');
    data.searchParams.delete('authRefreshToken');

    const nextSearch = data.searchParams.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
    window.history.replaceState({}, document.title, nextUrl);
  } catch (_) {}

  return true;
}

function isAgentApiRequest(url = '') {
  const value = String(url || '');
  return value === '/agent' || value.startsWith('/agent/');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const requestUrl = config.url || '';
  const token = isAgentApiRequest(requestUrl) ? getStoredAgentToken() : getStoredAccessToken();

  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original?.__skipAuthRefresh) {
      clearAuthTokens();
      clearAgentAuthToken();
      return Promise.reject(error);
    }

    if (status === 401 && original && isAgentApiRequest(original.url)) {
      clearAgentAuthToken();
      return Promise.reject(error);
    }

    if (status === 401 && original && !original.__retried && !original.url?.includes('/user/refresh-token')) {
      original.__retried = true;

      try {
        const refreshToken = getStoredRefreshToken();
        const refreshResponse = await api.post(
          '/user/refresh-token',
          refreshToken ? { refreshToken } : {},
          { __skipAuthRefresh: true }
        );

        const tokens = saveAuthTokens(refreshResponse.data);

        if (tokens.accessToken) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }

        return api(original);
      } catch (_) {
        clearAuthTokens();
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
