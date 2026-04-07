import { useState } from 'react';
import type { User } from '../types';
import { authApi } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { access_token, user_id, email: userEmail, display_name } = res.data;
      const userData: User = { id: user_id, email: userEmail, display_name, created_at: new Date().toISOString() };
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.detail || 'Logowanie nieudane' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    try {
      const res = await authApi.register(email, password, displayName);
      const { access_token, user_id, email: userEmail, display_name } = res.data;
      const userData: User = { id: user_id, email: userEmail, display_name, created_at: new Date().toISOString() };
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.detail || 'Rejestracja nieudana' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return { user, token, loading, login, register, logout, isAuthenticated: !!token };
}
