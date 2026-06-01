import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthAPI } from '../api/auth.js';
import { clearAuthTokens, consumeAuthTokensFromUrl, saveAuthTokens } from '../api/client.js';
import { clearRememberedCurrency, rememberUserCurrency } from '../utils/currency.js';
import { collectDeviceInfo, markDeviceInfoReported, shouldReportDeviceInfo } from '../utils/deviceInfo.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser);
    if (nextUser) rememberUserCurrency(nextUser);
    else clearRememberedCurrency();
    return nextUser;
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await AuthAPI.me();
    const nextUser = response.data?.data || response.data?.user || null;
    return applyUser(nextUser);
  }, [applyUser]);

  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      await AuthAPI.isAuthenticated();
      await refreshUser();
    } catch (_) {
      clearAuthTokens();
      applyUser(null);
    } finally {
      setLoading(false);
    }
  }, [refreshUser, applyUser]);

  useEffect(() => {
    consumeAuthTokensFromUrl();
    checkSession();
  }, [checkSession]);

  const reportDeviceInfo = useCallback(async (activityType = 'heartbeat', options = {}) => {
    if (!shouldReportDeviceInfo(options)) return;
    try {
      await AuthAPI.trackDeviceInfo(collectDeviceInfo(activityType));
      markDeviceInfoReported();
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    reportDeviceInfo('heartbeat', { force: true });

    const intervalMs = Math.max(60000, Number(import.meta.env.VITE_DEVICE_INFO_REFRESH_MS || 300000));
    const timer = window.setInterval(() => {
      reportDeviceInfo('heartbeat').catch(() => null);
    }, intervalMs);

    const handleFocus = () => reportDeviceInfo('focus').catch(() => null);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user?._id, reportDeviceInfo]);

  useEffect(() => {
    if (!user) return undefined;

    const refreshMs = Math.max(10000, Number(import.meta.env.VITE_WALLET_REFRESH_MS || 15000));
    const timer = window.setInterval(() => {
      refreshUser().catch(() => null);
    }, refreshMs);

    return () => window.clearInterval(timer);
  }, [user?._id, refreshUser]);

  const login = useCallback(async (payload) => {
    const response = await AuthAPI.login(payload);
    saveAuthTokens(response.data);

    const responseUser = response.data?.data?.user || response.data?.user || null;
    if (responseUser) applyUser(responseUser);

    await refreshUser().catch(() => null);
    await reportDeviceInfo('login', { force: true }).catch(() => null);
    return response;
  }, [refreshUser, applyUser, reportDeviceInfo]);

  const register = useCallback(async (payload) => {
    const response = await AuthAPI.register(payload);
    saveAuthTokens(response.data);

    const responseUser = response.data?.data?.user || response.data?.user || null;
    if (responseUser) applyUser(responseUser);

    await refreshUser().catch(() => null);
    await reportDeviceInfo('register', { force: true }).catch(() => null);
    return response;
  }, [refreshUser, applyUser, reportDeviceInfo]);

  const oneClickRegister = useCallback(async (payload) => {
    const response = await AuthAPI.oneClickRegister(payload);
    saveAuthTokens(response.data);

    const responseUser = response.data?.data?.user || response.data?.user || null;
    if (responseUser) applyUser(responseUser);

    await refreshUser().catch(() => null);
    await reportDeviceInfo('one-click-register', { force: true }).catch(() => null);
    return response;
  }, [refreshUser, applyUser, reportDeviceInfo]);

  const logout = useCallback(async () => {
    try {
      await AuthAPI.logout();
    } finally {
      clearAuthTokens();
      setUser(null);
      clearRememberedCurrency();
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    oneClickRegister,
    logout,
    refreshUser,
    checkSession,
    setUser: applyUser,
  }), [user, loading, login, register, oneClickRegister, logout, refreshUser, checkSession, applyUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
