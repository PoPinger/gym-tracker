import { useState } from 'react';
import type { MascotKind, User } from '../types';
import { authApi, apiErrorDetail } from '../services/api';

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

  // Store a TokenResponse from login / register / change-password
  const saveSession = (data: { access_token: string; user_id: number; email: string; display_name?: string; is_admin?: boolean; mascot?: MascotKind }) => {
    const userData: User = {
      id: data.user_id, email: data.email, display_name: data.display_name,
      is_admin: data.is_admin, mascot: data.mascot, created_at: new Date().toISOString(),
    };
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(data.access_token);
    setUser(userData);
  };

  // Refresh the stored user (e.g. is_admin) from the server
  const refreshUser = async () => {
    try {
      const res = await authApi.me();
      const userData: User = res.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch {
      // 401 is handled by the API interceptor; ignore other errors
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      saveSession(res.data);
      return { success: true };
    } catch (err) {
      return { success: false, error: apiErrorDetail(err) || 'Logowanie nieudane' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    try {
      const res = await authApi.register(email, password, displayName);
      saveSession(res.data);
      return { success: true };
    } catch (err) {
      return { success: false, error: apiErrorDetail(err) || 'Rejestracja nieudana' };
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

  return { user, token, loading, login, register, logout, saveSession, refreshUser, isAuthenticated: !!token };
}
