'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiClientError } from '@/lib/api';
import type { ApiResponse, User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const captureError = useCallback((err: unknown) => {
    const message = err instanceof ApiClientError || err instanceof Error ? err.message : 'Something went wrong';
    setError(message);
    throw err;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
      setUser(response.data.user);
      setError(null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const response = await api
      .post<ApiResponse<{ user: User }>>('/auth/login', { email, password })
      .catch(captureError);
    setUser(response.data.user);
  }, [captureError]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    const response = await api
      .post<ApiResponse<{ user: User }>>('/auth/register', { name, email, password })
      .catch(captureError);
    setUser(response.data.user);
  }, [captureError]);

  const logout = useCallback(async () => {
    setError(null);
    await api.post('/auth/logout').catch(captureError);
    setUser(null);
  }, [captureError]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    error,
    login,
    register,
    logout,
    refreshUser,
    clearError: () => setError(null),
  }), [error, isLoading, login, logout, refreshUser, register, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
