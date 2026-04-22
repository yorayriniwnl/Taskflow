import axios from 'axios';

export const AUTH_EXPIRED_EVENT = 'taskflow:auth-expired';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 10000;

let accessToken = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: true,
});

const clearSession = () => {
  accessToken = null;
  delete api.defaults.headers.common.Authorization;
};

const storeAccessToken = (token) => {
  accessToken = token;
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

const notifyAuthExpired = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((request) => (error ? request.reject(error) : request.resolve(token)));
  failedQueue = [];
};

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
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
            timeout: REQUEST_TIMEOUT_MS,
          }
        );
        const { accessToken: nextAccessToken } = response.data.data;
        storeAccessToken(nextAccessToken);
        processQueue(null, nextAccessToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearSession();
        notifyAuthExpired();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.patch('/auth/me', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const tasksApi = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  getStats: (params) => api.get('/tasks/stats', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export const adminApi = {
  getUsers: (params) => api.get('/admin/users', { params }),
  deactivateUser: (id) => api.patch(`/admin/users/${id}/deactivate`),
};

export const getAccessToken = () => accessToken;

export { clearSession, storeAccessToken };
export default api;
