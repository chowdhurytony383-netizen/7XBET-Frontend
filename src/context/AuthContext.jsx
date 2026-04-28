import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthAPI } from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const response = await AuthAPI.me();
    const nextUser = response.data?.data || response.data?.user || null;
    setUser(nextUser);
    return nextUser;
  }, []);

  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      await AuthAPI.isAuthenticated();
      await refreshUser();
    } catch (_) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(async (payload) => {
    const response = await AuthAPI.login(payload);
    const responseUser = response.data?.data?.user || null;
    if (responseUser) setUser(responseUser);
    await refreshUser().catch(() => null);
    return response;
  }, [refreshUser]);

  const register = useCallback(async (payload) => {
    const response = await AuthAPI.register(payload);
    await refreshUser().catch(() => null);
    return response;
  }, [refreshUser]);

  const oneClickRegister = useCallback(async (payload) => {
    const response = await AuthAPI.oneClickRegister(payload);
    const responseUser = response.data?.data?.user || response.data?.user || null;
    if (responseUser) setUser(responseUser);
    await refreshUser().catch(() => null);
    return response;
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await AuthAPI.logout();
    } finally {
      setUser(null);
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
    setUser,
  }), [user, loading, login, register, oneClickRegister, logout, refreshUser, checkSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
