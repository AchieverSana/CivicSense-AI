import axios from 'axios';
import type { AxiosError } from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
});

// Auto-attach Firebase token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error responses so callers get consistent shape
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string }>) => {
    // Surface the backend error message if available
    const message = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(Object.assign(err, { friendlyMessage: message }));
  }
);

// Issues
export const issueApi = {
  list: (params?: Record<string, string>) => api.get('/api/issues', { params }),
  get: (id: string) => api.get(`/api/issues/${id}`),
  create: (form: FormData) =>
    api.post('/api/issues', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  vote: (id: string) => api.post(`/api/issues/${id}/vote`),
  verify: (id: string) => api.post(`/api/issues/${id}/verify`),
  resolve: (id: string) => api.post(`/api/issues/${id}/resolve`),
  report: (id: string) => api.get(`/api/issues/${id}/report`, { responseType: 'blob' }),
  heatmap: (city: string) => api.get('/api/issues/heatmap', { params: { city } }),
};

// Dashboard
export const dashboardApi = {
  stats: (city: string) => api.get('/api/dashboard/stats', { params: { city } }),
};

// Users
export const userApi = {
  leaderboard: (city?: string) => api.get('/api/users/leaderboard', { params: { city } }),
  me: () => api.get('/api/users/me'),
  profile: (id: string) => api.get(`/api/users/${id}/profile`),
  promoteAdmin: (code: string) => api.post('/api/users/promote-admin', { code }),
};

// AI
export const aiApi = {
  chat: (messages: Array<{ role: string; parts: string }>, city?: string) =>
    api.post('/api/ai/chat', { messages, city }),
  insights: (city?: string) => api.get('/api/ai/insights', { params: { city } }),
};

export default api;
