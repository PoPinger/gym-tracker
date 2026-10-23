import axios from 'axios';
import type { MascotKind } from '../types';
import {
  createDayOffline, enqueue, idMap, isNetworkError, overlay, pendingRecords, readCache, setTransport, writeCache,
  type SetIn,
} from '../offline/queue';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Server-provided error message (FastAPI `detail`), if any
export const apiErrorDetail = (err: unknown): string | undefined =>
  axios.isAxiosError<{ detail?: string }>(err) ? err.response?.data?.detail : undefined;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // A 401 from login means wrong credentials, not an expired session: let the form show the error
    if (err.response?.status === 401 && err.config?.url !== '/auth/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
setTransport(api);

// GETs the logger and weight pages need offline: network first (result cached on the phone), cache when offline.
// Both are overlaid with writes not yet on the server. Writes pending at the start are kept in the overlay too,
// so a write sent while the request was in flight is never missing from the result.
async function cachedGet(url: string, params?: Record<string, string | number | boolean>) {
  const key = params ? `${url}?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}` : url;
  const before = await pendingRecords();
  try {
    const r = await api.get(url, { params });
    void writeCache(key, r.data);
    return { ...r, data: await overlay(url, r.data, before) };
  } catch (e) {
    const cached = isNetworkError(e) ? await readCache(key) : undefined;
    if (cached === undefined) throw e;
    return { data: await overlay(url, cached, before) };
  }
}

// A day created offline keeps a temporary negative id until synced
async function getDayLog(logId: number) {
  const real = logId < 0 ? (await idMap())[logId] : logId;
  if (real != null) return cachedGet(`/day-logs/${real}`);
  const cached = await readCache(`/day-logs/${logId}`);
  if (cached === undefined) throw new Error('day log not available offline');
  return { data: await overlay(`/day-logs/${logId}`, cached) };
}

// Auth
export const authApi = {
  register: (email: string, password: string, display_name?: string) =>
    api.post('/auth/register', { email, password, display_name }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  changePassword: (current_password: string, new_password: string) =>
    api.post('/auth/change-password', { current_password, new_password }),
  resetVerify: (email: string, code: string) =>
    api.post('/auth/password-reset/verify', { email, code }),
  resetComplete: (reset_token: string, new_password: string) =>
    api.post('/auth/password-reset/complete', { reset_token, new_password }),
};

// Admin (backend enforces is_admin; 403 otherwise)
export const adminApi = {
  listUsers: () => api.get('/admin/users'),
  createResetCode: (userId: number) => api.post(`/admin/users/${userId}/reset-code`),
  setMascot: (userId: number, mascot: MascotKind) => api.put(`/admin/users/${userId}/mascot`, { mascot }),
};

// Plans
export const plansApi = {
  list: () => cachedGet('/plans'),
  create: (data: object) => api.post('/plans', data),
  get: (id: number) => cachedGet(`/plans/${id}`),
  update: (id: number, data: object) => api.put(`/plans/${id}`, data),
  updateStructure: (id: number, data: object) => api.put(`/plans/${id}/structure`, data),
  delete: (id: number) => api.delete(`/plans/${id}`),
  copy: (id: number) => api.post(`/plans/${id}/copy`),
  complete: (id: number) => api.post(`/plans/${id}/complete`),
  getDays: (id: number) => api.get(`/plans/${id}/days`),
  addDay: (id: number, data: object) => api.post(`/plans/${id}/days`, data),
  getWeeks: (id: number) => cachedGet(`/plans/${id}/weeks`),
};

export const planDaysApi = {
  update: (id: number, data: object) => api.put(`/plan-days/${id}`, data),
  addExercise: (dayId: number, data: object) => api.post(`/plan-days/${dayId}/exercises`, data),
};

export const exercisesApi = {
  update: (id: number, data: object) => api.put(`/exercises/${id}`, data),
  delete: (id: number) => api.delete(`/exercises/${id}`),
  history: (id: number, allPlans: boolean) => cachedGet(`/exercises/${id}/history`, { all_plans: allPlans }),
  // The note is queued like the sets so it can be written offline
  saveNote: (id: number, note: string, label: string) => enqueue({ kind: 'note', exerciseId: id, note }, label),
  reorder: (exercises: Array<{ id: number; exercise_order: number }>) =>
    api.post('/exercises/reorder', { exercises }),
};

export const logsApi = {
  getWeekDays: (weekId: number) => cachedGet(`/weeks/${weekId}/days`),
  // Offline, a day never opened before is built from the cached plan and created on the server when synced
  createDayLog: async (planDayId: number, trainingWeekId: number, planId: number, label: string) => {
    try {
      return await api.post('/day-logs', { plan_day_id: planDayId, training_week_id: trainingWeekId });
    } catch (e) {
      const log = isNetworkError(e) ? await createDayOffline(trainingWeekId, planDayId, planId, label) : null;
      if (!log) throw e;
      return { data: log };
    }
  },
  getDayLog,
  // Workout writes go through the offline queue (sent in order; kept on the phone while offline)
  saveSets: (exerciseLogId: number, sets: SetIn[], label: string, workoutDate?: string, skipped?: boolean, exerciseSkipped?: boolean) =>
    enqueue({ kind: 'saveSets', exLogId: exerciseLogId, sets, workoutDate, skipped, exerciseSkipped }, label),
  completeDay: (logId: number, label: string, workoutDate?: string, skipped?: boolean) =>
    enqueue({ kind: 'completeDay', logId, workoutDate, skipped }, label),
  completeWeek: (weekId: number) => api.post(`/weeks/${weekId}/complete`),
  setDeload: (weekId: number, isDeload: boolean) => api.put(`/weeks/${weekId}/deload`, { is_deload: isDeload }),
};

// Weight
export const weightApi = {
  getCurrentCycle: () => cachedGet('/weight/current-cycle'),
  createCycle: (months: number, goal: 'bulk' | 'cut') =>
    api.post('/weight/cycles', { months, goal }),
  updateGoal: (id: number, goal: 'bulk' | 'cut') => api.patch(`/weight/cycles/${id}`, { goal }),
  updateMonths: (id: number, months: number) => api.patch(`/weight/cycles/${id}`, { months }),
  deleteCycle: (id: number) => api.delete(`/weight/cycles/${id}`),
  saveDayWeight: (dayLogId: number, weightKg: number, label: string) =>
    enqueue({ kind: 'weight', dayLogId, weightKg }, label),
  completeWeek: (weekId: number) => api.post(`/weight/weeks/${weekId}/complete`),
};

// Web Push for the rest timer (per device, identified by its push endpoint)
export const pushApi = {
  key: () => api.get<{ enabled: boolean; key: string | null }>('/push/key'),
  subscribe: (sub: PushSubscriptionJSON) => api.post('/push/subscriptions', sub),
  unsubscribe: (endpoint: string) => api.delete('/push/subscriptions', { data: { endpoint } }),
  scheduleRest: (endpoint: string, seconds: number, title: string, body: string) =>
    api.put('/push/rest', { endpoint, seconds, title, body }),
  cancelRest: (endpoint: string) => api.delete('/push/rest', { data: { endpoint } }),
};

// Dashboard
export const dashboardApi = {
  get: () => cachedGet('/dashboard'),
};
