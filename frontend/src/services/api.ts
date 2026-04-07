import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authApi = {
  register: (email: string, password: string, display_name?: string) =>
    api.post('/auth/register', { email, password, display_name }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// Plans
export const plansApi = {
  list: () => api.get('/plans'),
  create: (data: object) => api.post('/plans', data),
  get: (id: number) => api.get(`/plans/${id}`),
  update: (id: number, data: object) => api.put(`/plans/${id}`, data),
  updateStructure: (id: number, data: object) => api.put(`/plans/${id}/structure`, data),
  delete: (id: number) => api.delete(`/plans/${id}`),
  copy: (id: number) => api.post(`/plans/${id}/copy`),
  complete: (id: number) => api.post(`/plans/${id}/complete`),
  getDays: (id: number) => api.get(`/plans/${id}/days`),
  addDay: (id: number, data: object) => api.post(`/plans/${id}/days`, data),
  getWeeks: (id: number) => api.get(`/plans/${id}/weeks`),
};

export const planDaysApi = {
  update: (id: number, data: object) => api.put(`/plan-days/${id}`, data),
  addExercise: (dayId: number, data: object) => api.post(`/plan-days/${dayId}/exercises`, data),
};

export const exercisesApi = {
  update: (id: number, data: object) => api.put(`/exercises/${id}`, data),
  delete: (id: number) => api.delete(`/exercises/${id}`),
  reorder: (exercises: Array<{ id: number; exercise_order: number }>) =>
    api.post('/exercises/reorder', { exercises }),
};

export const logsApi = {
  getWeekDays: (weekId: number) => api.get(`/weeks/${weekId}/days`),
  createDayLog: (planDayId: number, trainingWeekId: number) =>
    api.post('/day-logs', { plan_day_id: planDayId, training_week_id: trainingWeekId }),
  getDayLog: (logId: number) => api.get(`/day-logs/${logId}`),
  saveSets: (exerciseLogId: number, sets: object[]) =>
    api.put(`/exercise-logs/${exerciseLogId}/sets`, sets),
  completeDay: (logId: number) => api.post(`/day-logs/${logId}/complete`),
  completeWeek: (weekId: number) => api.post(`/weeks/${weekId}/complete`),
};

// Weight
export const weightApi = {
  getCurrentCycle: () => api.get('/weight/current-cycle'),
  createCycle: (startWeight: number, months: number) =>
    api.post('/weight/cycles', { start_weight: startWeight, months }),
  deleteCycle: (id: number) => api.delete(`/weight/cycles/${id}`),
  saveDayWeight: (dayLogId: number, weightKg: number) =>
    api.put(`/weight/day-logs/${dayLogId}`, { weight_kg: weightKg }),
  completeWeek: (weekId: number) => api.post(`/weight/weeks/${weekId}/complete`),
};

// Dashboard
export const dashboardApi = {
  get: () => api.get('/dashboard'),
};
