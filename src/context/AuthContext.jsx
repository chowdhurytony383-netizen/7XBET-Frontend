import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthAPI } from '../api/auth.js';
import { clearRememberedCurrency, rememberUserCurrency } from '../utils/currency.js';

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
      applyUser(null);
    } finally {
      setLoading(false);
    }
  }, [refreshUser, applyUser]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(async (payload) => {
    const response = await AuthAPI.login(payload);
    const responseUser = response.data?.data?.user || null;
    if (responseUser) applyUser(responseUser);
    await refreshUser().catch(() => null);
    return response;
  }, [refreshUser, applyUser]);

  const register = useCallback(async (payload) => {
    const response = await AuthAPI.register(payload);
    await refreshUser().catch(() => null);
    return response;
  }, [refreshUser]);

  const oneClickRegister = useCallback(async (payload) => {
    const response = await AuthAPI.oneClickRegister(payload);
    const responseUser = response.data?.data?.user || response.data?.user || null;
    if (responseUser) applyUser(responseUser);
    await refreshUser().catch(() => null);
    return response;
  }, [refreshUser, applyUser]);

  const logout = useCallback(async () => {
    try {
      await AuthAPI.logout();
    } finally {
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
