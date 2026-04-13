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

// ─── Global singleton refresh ─────────────────────────────────────────────────
// Guards all concurrent callers (hydrate() on page load + 401 interceptors) so
// only ONE HTTP POST /refresh ever reaches the backend at a time.  Multiple
// concurrent callers all await the same promise and receive the same token,
// preventing the token-rotation replay-detection from revoking user sessions.
let _refreshPromise: Promise<string | null> | null = null;

function sharedRefresh(): Promise<string | null> {
  if (!_refreshPromise) {
    _refreshPromise = refreshClient
      .post('/refresh')
      .then(({ data }) => (data?.data?.accessToken as string) ?? null)
      .catch(() => null)
      .finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (original.url === '/refresh' || original._retry) return Promise.reject(error);

    if (error.response?.status === 401) {
      original._retry = true;
      const token = await sharedRefresh();
      if (token) {
        useAuthStore.setState({ accessToken: token, fullAccessToken: token, isAuthenticated: true });
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      // Refresh failed — clear auth state and redirect
      useAuthStore.setState({ accessToken: null, fullAccessToken: null, isAuthenticated: false });
      sessionStorage.removeItem('tenantId');
      sessionStorage.removeItem('activeModule');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  login: (body: { email: string; password: string }) => api.post('/login', body),
  /** Uses the shared singleton refresh — safe to call concurrently */
  silentRefresh: sharedRefresh,
  /** No body — logout clears the cookie server-side */
  logout: () => api.post('/logout'),
  getProfile: () => api.get('/profile'),
  myOrganizations: () => api.get('/organizations/me/list'),
  switchOrganization: (body: { organizationId: string }) => api.post('/organizations/switch', body),
  scopeToken: (body: { module: string }) => api.post<{ data: { accessToken: string; module: string; permissions: string[] } }>('/scope-token', body),
  listModuleConfigs: () => api.get<{ data: { moduleId: string; moduleKey: string; enabled: boolean }[] }>('/modules'),
};
