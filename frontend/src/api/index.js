import axios from 'axios';

const ACCESS_TOKEN_KEY = 'accessToken';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,
});

const clearSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  delete api.defaults.headers.common.Authorization;
};

const storeAccessToken = (token) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRefreshRequest = originalRequest?.url?.includes('/auth/refresh');
    const isAuthEntryRequest =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRefreshRequest && !isAuthEntryRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          '/api/v1/auth/refresh',
          {},
          {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
          }
        );
        const { accessToken } = res.data.data;
        storeAccessToken(accessToken);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearSession();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.patch('/auth/me', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ── Tasks API ─────────────────────────────────────────────────────────────────
export const tasksApi = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  getStats: (params) => api.get('/tasks/stats', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// ── Admin API ─────────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: (params) => api.get('/admin/users', { params }),
  deactivateUser: (id) => api.patch(`/admin/users/${id}/deactivate`),
};

export { clearSession, storeAccessToken };
export default api;
