import axios from 'axios';
import { useAuthStore } from '../../store/auth';

const api = axios.create({
  baseURL: '/api/v1/auth',
  headers: { 'Content-Type': 'application/json' },
  // The HttpOnly refresh cookie is sent automatically by the browser,
  // but we also need credentials: 'include' for cross-origin setups.
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const tenantId = sessionStorage.getItem('tenantId');
  if (tenantId) config.headers['X-Tenant-Id'] = tenantId;
  // Access token read from in-memory Zustand store — never from localStorage
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Dedicated client for the /refresh call so it never triggers itself in a loop
const refreshClient = axios.create({
  baseURL: '/api/v1/auth',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // must be true so the HttpOnly cookie is sent
});

let isRefreshing = false;
let refreshQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (original.url === '/refresh' || original._retry) return Promise.reject(error);

    if (error.response?.status === 401) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // No body needed — the browser sends the HttpOnly __erp_rt cookie automatically
        const { data } = await refreshClient.post('/refresh');
        const newAccessToken = data.data.accessToken;
        // Store only in memory — never in localStorage
        useAuthStore.setState({ accessToken: newAccessToken, fullAccessToken: newAccessToken, isAuthenticated: true });
        refreshQueue.forEach((p) => p.resolve(newAccessToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch (refreshError) {
        refreshQueue.forEach((p) => p.reject(error));
        refreshQueue = [];
        useAuthStore.setState({ accessToken: null, fullAccessToken: null, isAuthenticated: false });
        sessionStorage.removeItem('tenantId');
        sessionStorage.removeItem('activeModule');
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  login: (body: { email: string; password: string }) => api.post('/login', body),
  /** No body — refresh token is in the HttpOnly cookie, sent automatically */
  silentRefresh: () => refreshClient.post('/refresh'),
  /** No body — logout clears the cookie server-side */
  logout: () => api.post('/logout'),
  getProfile: () => api.get('/profile'),
  myOrganizations: () => api.get('/organizations/me/list'),
  switchOrganization: (body: { organizationId: string }) => api.post('/organizations/switch', body),
  scopeToken: (body: { module: string }) => api.post<{ data: { accessToken: string; module: string; permissions: string[] } }>('/scope-token', body),
};
